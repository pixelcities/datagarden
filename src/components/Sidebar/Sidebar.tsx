import React, { FC, useRef, useState } from 'react'
import { Link, useRouteMatch } from "react-router-dom";

import { gsap } from 'gsap'

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
  isMini: boolean
}

const Sidebar: FC<SidebarProps> = (props) => {
  const [ isMini, setMini ] = useState(props.isMini)

  const sidebarRef = useRef<HTMLDivElement | null>(null)
  const mainRef = useRef<HTMLDivElement | null>(null)

  const { path, url } = useRouteMatch();
  const matches = path.match(/.*(?=\/:).:\w+(.*)/)
  const basepath = matches ? url.replace(new RegExp(`${matches[1]}$`), "") : ""

  const toggleMini = () => {
    if (isMini) {
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

  return (
    <>
      <div className="bar-wrapper" ref={sidebarRef} style={{width: isMini ? MINIBAR_WIDTH : SIDEBAR_WIDTH}}>
        { isMini ?
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
                  <li><Link className="menu-label has-text-centered my-3 px-0 py-0" style={{cursor: "default"}} to={basepath}>
                    <img src={ecosystemIcon} alt="" />
                  </Link></li>
                  <li><Link className="menu-label has-text-centered my-3 px-0 py-0" to={basepath}>
                    <img src={builderIcon} alt="" />
                  </Link></li>
                  <li><Link className="menu-label has-text-centered my-3 px-0 py-0" style={{cursor: "default"}} to={basepath}>
                    <img src={widgetsIcon} alt="" />
                  </Link></li>
                </ul>
              </aside>
            </div>
          ) : (
            <div className="sidebar-section">
              <aside className="menu">
                <div className="menu-label has-text-right pr-4 pt-3" onClick={() => toggleMini()}>
                  <img src={flippedCollapseIcon} alt="" />
                </div>
                <ul className="menu-list">
                  <li><Link className="button-label" style={{cursor: "default", color: "#a2a2a2"}} to={basepath}>Team Management</Link></li>
                </ul>
                <ul className="menu-list">
                  <li><Link className="button-label is-active" to="/">Data Ecosystem</Link></li>
                  <li>
                    <ul>
                      <li><Link className={"button-label" + (props.page === "sources" ? " is-active" : "")} to={basepath + "/sources"}>Data Sources</Link></li>
                      <li><Link className="button-label" style={{cursor: "default", color: "#a2a2a2"}} to={basepath}>Taxonomy</Link></li>
                      <li><Link className={"button-label" + (props.page === "builder" ? " is-active" : "")} to={basepath}>Pipeline Builder</Link></li>
                      <li><Link className="button-label" style={{cursor: "default", color: "#a2a2a2"}} to={basepath}>Widgets</Link></li>
                    </ul>
                  </li>
                </ul>
                <ul className="menu-list">
                  <li><Link className="button-label" style={{cursor: "default", color: "#a2a2a2"}} to={basepath}>Integrations</Link></li>
                  <li><Link className="button-label" style={{cursor: "default", color: "#a2a2a2"}} to={basepath}>Reports</Link></li>
                </ul>
              </aside>
            </div>
          )
        }

      </div>

      <div ref={mainRef} className="main-section" style={{marginLeft: isMini ? MINIBAR_WIDTH : SIDEBAR_WIDTH}}>
        { props.children }
      </div>
    </>

  )
}

export default Sidebar
