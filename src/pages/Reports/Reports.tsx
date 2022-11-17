import React, { FC, Component } from 'react'
import { RouteComponentProps } from 'react-router'
import { Route } from "react-router-dom"

import Navbar from 'components/Navbar'
import Sidebar from 'components/Sidebar'
import Editor from 'components/Editor'


class ReportsRoute extends Component<RouteComponentProps> {
  parentPath = (this.props.match.params as any).path

  render() {
    return (
      <div>
        <Navbar />

        <Sidebar page="reports" isMini={false}>
          <Route path={this.parentPath} component={Reports} />
        </Sidebar>
      </div>
    )
  }
}

const Reports: FC = (props) => {
  return (
    <div className="page px-0 pt-0">

      <div className="title">
        Reports

        <div className="border" />
      </div>

      <div className="main px-4">
        <Editor
          isEditing={true}
        />
      </div>
    </div>
  )
}

export default ReportsRoute;
