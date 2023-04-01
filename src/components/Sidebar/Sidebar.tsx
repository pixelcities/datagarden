import React, { FC, useRef, useState, useMemo } from 'react'
import { Link, useRouteMatch } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCog } from '@fortawesome/free-solid-svg-icons'

import { gsap } from 'gsap'

import DSSettings from 'components/DSSettings'

import builderIcon from 'assets/minibar-builder.svg'
import collapseIcon from 'assets/minibar-collapse.svg'
import flippedCollapseIcon from 'assets/minibar-collapse-flipped.svg'
import datasourceIcon from 'assets/minibar-datasource.svg'
import ecosystemIcon from 'assets/minibar-ecosystem.svg'
import widgetsIcon from 'assets/minibar-widgets.svg'

import './Sidebar.sass'


const MINIBAR_WIDTH = "32px"
const SIDEBAR_WIDTH = "18rem"

interface SidebarProps {
  page: string,
  isMini: boolean,
  isDisabled?: boolean
}

const Sidebar: FC<SidebarProps> = ({ page, isMini, isDisabled = false, children }) => {
  const [ isMinified, setMini ] = useState(isMini)
  const [ settingsIsActive, setSettingsIsActive ] = useState(false)

  const sidebarRef = useRef<HTMLDivElement | null>(null)
  const mainRef = useRef<HTMLDivElement | null>(null)

  const { path, url } = useRouteMatch();
  const matches = path.match(/.*(?=\/:).:\w+(.*)/)
  const basepath = matches ? url.replace(new RegExp(`${matches[1]}$`), "") : ""

  const toggleMini = () => {
    if (isMinified) {
      setMini(false)

      gsap.timeline()
        .fromTo(sidebarRef.current, {width: MINIBAR_WIDTH}, {width: SIDEBAR_WIDTH, duration: 1}, 0)
        .fromTo(mainRef.current, {marginLeft: MINIBAR_WIDTH}, {marginLeft: SIDEBAR_WIDTH, duration: 1}, 0)

    } else {
      setMini(true)

      gsap.timeline()
        .fromTo(sidebarRef.current, {width: SIDEBAR_WIDTH}, {width: MINIBAR_WIDTH, duration: 1}, 0)
        .fromTo(mainRef.current, {marginLeft: SIDEBAR_WIDTH}, {marginLeft: MINIBAR_WIDTH, duration: 1}, 0)
    }
  }

  const renderSettings = useMemo(() => {
    return (
      <div className="bar-footer">
        <div className={isMinified ? "has-text-centered pl-1" : "has-text-right pr-4"}>
          <span className="icon" onClick={() => setSettingsIsActive(true)} style={{cursor: "pointer"}}>
            <FontAwesomeIcon icon={faCog} size="xs" color="white"/>
          </span>
        </div>
      </div>
    )
  }, [ isMinified ])

  return (
    <>
      { settingsIsActive &&
        <DSSettings
          isActive={settingsIsActive}
          onClose={() => setSettingsIsActive(false)}
        />
      }

      <div className="bar-wrapper" ref={sidebarRef} style={{width: isMinified ? MINIBAR_WIDTH : SIDEBAR_WIDTH}}>
        { isMinified ?
          (
            <div className="minibar-section">
              <aside className="menu">
                <div className="menu-label has-text-centered pt-3" onClick={() => toggleMini()}>
                  <img src={collapseIcon} alt="" />
                </div>
                <ul className="menu-list">
                  <li><Link className="menu-label has-text-centered my-3 px-0 py-0" to={basepath + "/sources"}>
                    <img src={datasourceIcon} alt="" />
                  </Link></li>
                  <li><Link className="menu-label has-text-centered my-3 px-0 py-0" to={basepath + "/taxonomy"}>
                    <img src={ecosystemIcon} alt="" />
                  </Link></li>
                  <li><Link className="menu-label has-text-centered my-3 px-0 py-0" to={basepath}>
                    <img src={builderIcon} alt="" />
                  </Link></li>
                  <li><Link className="menu-label has-text-centered my-3 px-0 py-0" to={basepath + "/widgets"}>
                    <img src={widgetsIcon} alt="" />
                  </Link></li>
                </ul>
              </aside>

              { renderSettings }
            </div>
          ) : (
            <div className="sidebar-section">
              <aside className="menu">
                <div className="menu-label has-text-right pr-4 pt-3" onClick={() => toggleMini()}>
                  <img src={flippedCollapseIcon} alt="" />
                </div>
                <ul className="menu-list">
                  { basepath.indexOf("trial") !== -1 ?
                    <li><Link  className="button-label" style={{cursor: "default", color: "#a2a2a2"}} to={basepath}>Team Management</Link></li>
                  :
                    <li><Link className={"button-label" + (page === "settings" ? " is-active" : "")} to={basepath + "/settings"}>Team Management</Link></li>
                  }
                </ul>
                <ul className="menu-list">
                  <li><Link className={"button-label" + (["sources", "taxonomy", "builder", "widgets"].includes(page) ? " is-active" : "")} to={basepath}>Data Ecosystem</Link></li>
                  <li>
                    <ul>
                      <li><Link className={"button-label" + (page === "sources" ? " is-active" : "")} to={basepath + "/sources"}>Data Sources</Link></li>
                      <li><Link className={"button-label"  + (page === "taxonomy" ? " is-active" : "")} to={basepath + "/taxonomy"}>Taxonomy</Link></li>
                      <li><Link className={"button-label" + (page === "builder" ? " is-active" : "")} to={basepath}>Pipeline Builder</Link></li>
                      <li><Link className={"button-label"  + (page === "widgets" ? " is-active" : "")} to={basepath + "/widgets"}>Widgets</Link></li>
                    </ul>
                  </li>
                </ul>
                <ul className="menu-list">
                  <li><Link className="button-label" style={{cursor: "default", color: "#a2a2a2"}} to={basepath}>Integrations</Link></li>
                  <li><Link className={"button-label" + (page === "reports" ? " is-active": "")} to={basepath + "/reports"}>Reports</Link></li>
                </ul>
              </aside>

              { renderSettings }
            </div>
          )
        }

      </div>

      <div ref={mainRef} className="main-section" style={{marginLeft: isMinified ? MINIBAR_WIDTH : SIDEBAR_WIDTH}}>
        { children }
      </div>
    </>

  )
}

export default Sidebar
