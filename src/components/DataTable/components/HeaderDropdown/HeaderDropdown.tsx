import React, { FC, useState } from 'react'

import { useDrop, useDrag } from 'react-dnd';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faUserSlash, faCog, faSearch, faSortAmountUpAlt, faSortAmountDown } from '@fortawesome/free-solid-svg-icons'
import { faClipboard } from '@fortawesome/free-regular-svg-icons'

import { User, Source, Collection, Share, Column } from 'types'

import { useAppDispatch, useAppSelector } from 'hooks'
import { selectUserByEmail, selectSourceById, selectCollectionById } from 'state/selectors'
import { shareSecret, updateSource, updateCollection } from 'state/actions'

import { useAuthContext } from 'contexts';
import { useKeyStoreContext } from 'contexts'


interface HeaderDropdownProps {
  fieldId: string,
  fieldName?: string,
  inputId: string,
  settings: boolean
}

interface ShareInstanceProps {
  share: Share,
  updateUser: any
}


const FilterOptions: FC = () => {
  return (
    <>
      <div className="panel-block-nb">
        <p className="control has-icons-left">
          <input className="input" type="text" placeholder="Search" />
          <span className="icon is-left">
            <FontAwesomeIcon icon={faSearch} size="xs"/>
          </span>
        </p>
      </div>

      <div className="panel-block-nb">
        <p className="header-label">
          Filters
        </p>
      </div>

      <div className="panel-block-nb is-button" onClick={() => {}}>
        <span className="panel-icon">
          <FontAwesomeIcon icon={faSortAmountUpAlt} size="sm"/>
        </span>
        <p className="fineprint-label label-size-3">
          Sort Ascending
        </p>
      </div>

      <div className="panel-block-nb is-button" onClick={() => {}}>
        <span className="panel-icon">
          <FontAwesomeIcon icon={faSortAmountDown} size="sm"/>
        </span>
        <p className="fineprint-label label-size-3">
          Sort Descending
        </p>
      </div>


      <div className="panel-block" />

      <div className="panel-block-nb">
        <button className="button is-link is-outlined is-fullwidth">
          Reset all filters
        </button>
      </div>
    </>
  )
}

const ShareInstance: FC<ShareInstanceProps> = ({ share, updateUser }) => {
  const user = useAppSelector(state => selectUserByEmail(state, share.principal || ""))

  const [{ opacity }, dragRef] = useDrag(
    () => ({
      type: "HeaderDropdown",
      item: user?.id,
      end: (e, monitor) => {
        const result: any = monitor.getDropResult()

        if (result && result.box) {
          updateUser(user, result.box)
        }
      },
      collect: (monitor) => ({
        opacity: monitor.isDragging() ? 0.5 : 1
      })
    }),
    []
  )

  let icon = faUserSlash
  let color = "red"

  if (share.type === "masked") {
    color = "orange"
  } else if (share.type === "full" || share.type === "owner") {
    icon = faUser
    color = "green"
  }

  return (
    <div ref={dragRef} key={user?.id} className="panel-block-nb is-button" style={{opacity: opacity, cursor: "grab"}}>
      <span className="panel-icon">
        <FontAwesomeIcon icon={icon} color={color} size="sm"/>
      </span>
      <p className="fineprint-label label-size-3">
        {user?.email}
      </p>
    </div>
  )
}

interface ShareDefaultOptionsI {
  me: User,
  columnId: string,
}

interface ShareSourceOptionsI extends ShareDefaultOptionsI {
  source: Source,
  collection?: never,
}

interface ShareCollectionOptionsI extends ShareDefaultOptionsI {
  source?: never,
  collection: Collection
}

type ShareOptionsI = ShareSourceOptionsI | ShareCollectionOptionsI

const ShareOptions: FC<ShareOptionsI> = ({ me, columnId, source, collection }) => {
  const dispatch = useAppDispatch()

  const { keyStore, protocol } = useKeyStoreContext();

  const input = (source || collection) as Source | Collection
  const schema = input.schema
  const column = schema.columns.find(c => c.id === columnId)
  const shares = React.useMemo(() => {
    if (column) {
      return column.shares.reduce((acc: {[key: string]: string}, share: Share) => ({...acc, [share.principal || ""]: share.type}), {})
    } else {
      return {}
    }
  }, [ column ])

  const setUsers = React.useCallback((column: Column) => (user: User, access: string) => {
    if (access === "FullAccess" && !(user.email in shares)) {
      let columns: Column[] = []
      input.schema.columns.forEach((c) => {
        if (c.id !== column?.id) {
          columns.push(c)
        }
      })

      if (column) {
        columns.push({
          id: column.id,
          key_id: column.key_id,
          shares: [...column.shares ?? [], {
            type: "full",
            principal: user.email
          }]
        })

        protocol?.encrypt(user.id, keyStore?.get_key(column.key_id)).then((secret: string) => {
          dispatch(shareSecret({
            key_id: column.key_id,
            owner: me.id,
            receiver: user.id,
            ciphertext: secret
          }))

          if (source) {
            dispatch(updateSource({...source, ...{
              schema: {...schema, ...{
                columns: columns
              }}
            }}))

          } else if (collection) {
            dispatch(updateCollection({...collection, ...{
              schema: {...schema, ...{
                columns: columns
              }}
            }}))
          }
        })
      }

    } else if (access === "Blocked" && user.email in shares) {
      console.log("[WARNING] Removing access requires key rotation and is not yet implemented")

      let columns: Column[] = []
      input.schema.columns.forEach((c) => {
        if (c.id !== column?.id) {
          columns.push(c)
        }
      })

      if (column) {
        columns.push({
          id: column.id,
          key_id: column.key_id,
          shares: column.shares.filter(s => s.principal !== user.email)
        })

        if (source) {
          dispatch(updateSource({...source, ...{
            schema: {...schema, ...{
              columns: columns
            }}
          }}))
        } else if (collection) {
          dispatch(updateCollection({...collection, ...{
            schema: {...schema, ...{
              columns: columns
            }}
          }}))
        }
      }
    }
  }, [ me, schema, shares, input, source, collection, dispatch, keyStore, protocol ])

  const [{ isOverFull }, dropRefFull] = useDrop(() => ({
    accept: "HeaderDropdown",
    drop: () => { return { box: "FullAccess" }},
    collect: (monitor: any) => ({ isOverFull: monitor.isOver() })
  }), [])

  const [{ isOverBlocked }, dropRefBlocked] = useDrop(() => ({
    accept: "HeaderDropdown",
    drop: () => { return { box: "Blocked" }},
    collect: (monitor: any) => ({ isOverBlocked: monitor.isOver() })
  }), [])

  const renderAllowedUsers = React.useMemo(() => {
    if (column) {
      return column.shares.map(s => {
        return <ShareInstance key={s.principal} share={s} updateUser={setUsers(column)} />
      })
    }

  }, [ column, setUsers ])

  const renderDisallowedUsers = React.useMemo(() => {
    let disallowedUsers: Share[] = []

    if (column) {
      schema.shares.forEach(share => {
        const principal = share.principal || ""

        if (! (principal in shares)) {
          disallowedUsers.push({
            principal: principal,
            type: "disallowed"
          })
        }
      })

      return disallowedUsers.map(u => {
        return <ShareInstance key={u.principal} share={u} updateUser={setUsers(column)} />
      })
    }
  }, [ schema, shares, column, setUsers])

  return (
    <>
      <div className="panel-block-nb">
        <p className="header-label">
          Full Access
        </p>
      </div>
      <div ref={dropRefFull} style={{height: 100, borderWidth: "thin", borderStyle: isOverFull ? "dashed" : "none"}}>
        { renderAllowedUsers }
      </div>

      <div className="panel-block" />
      <div className="panel-block-nb">
        <p className="header-label">
          Blocked
        </p>
      </div>
      <div ref={dropRefBlocked} style={{height: 100, borderWidth: "thin", borderStyle: isOverBlocked ? "dashed" : "none"}}>
        { renderDisallowedUsers }
      </div>

    </>
  )
}

const HeaderDropdown: FC<HeaderDropdownProps> = ({ fieldId, fieldName, inputId, settings }) => {
  const { user } = useAuthContext();

  const source = useAppSelector(state => selectSourceById(state, inputId))
  const collection = useAppSelector(state => selectCollectionById(state, inputId))

  const [settingsActive, setSettingsActive] = useState<boolean>(settings)

  const renderDropdown = React.useMemo(() => {
    if (user && settingsActive && source) {
      return (
        <ShareOptions me={user} columnId={fieldId} source={source} />
      )

    } else if (user && settingsActive && collection) {
      return (
        <ShareOptions me={user} columnId={fieldId} collection={collection} />
      )

    } else {
      return (
        <FilterOptions />
      )

    }
  }, [ user, settingsActive, fieldId, source, collection ])

  return (
    <nav className="panel" style={{background: "white"}}>
      <div className="panel-heading pt-3 pb-2  ">
        <span className="icon-text">
          <p className="header-label label-size-2">
            { fieldName || fieldId }
          </p>
          <div className="icon is-small pl-2" style={{cursor: "pointer"}}>
            <FontAwesomeIcon icon={faClipboard} size="sm"/>
          </div>
        </span>

        <div className="icon is-small is-pulled-right pt-1" style={{cursor: "pointer"}} onClick={() => setSettingsActive(!settingsActive)}>
          <FontAwesomeIcon icon={faCog} color={settingsActive ? "#363636" : "#929292"} size="sm"/>
        </div>
      </div>

      { renderDropdown }

    </nav>
  )
}

export default HeaderDropdown
