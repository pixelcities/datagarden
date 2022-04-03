import React, { FC, useEffect } from 'react';
import { Redirect, Route, RouteProps } from 'react-router-dom';
import { useAuthContext } from 'utils/AuthContext';

const PrivateRoute: FC<RouteProps> = ({component: Component, ...rest}) => {
  const { isAuthenticated, setPath } = useAuthContext()

  useEffect(() => {
    if (!isAuthenticated) {
      setPath(rest.path)
    }
  }, [isAuthenticated, setPath, rest.path])

  if (!Component) return null

  return (
    <Route
      {...rest}
      render={props =>
        isAuthenticated
          ? <Component {...props} />
          : <Redirect to="/login" />
      }
    />
  )
}

export default PrivateRoute;

