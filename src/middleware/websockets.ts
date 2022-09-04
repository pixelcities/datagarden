import { Middleware, MiddlewareAPI, Dispatch, AnyAction } from "redux"
import { events, loadDataSpace } from 'state/actions'
import { getState, saveState } from 'utils/localStorage'

import { Socket, Channel } from 'phoenix';

class WebSocket {
  endpoint: string
  callback: (event: any) => void
  socket?: Socket
  channel?: Channel
  ds?: Channel

  constructor(endpoint: string, callback: (event: any) => void) {
    this.endpoint = endpoint
    this.callback = callback
  }

  handleSocket(token: string) {
    this.socket = new Socket(this.endpoint, {params: {token: token}})
    this.socket.connect()
  }

  handleUserChannel(user_id: string) {
    if (this.socket) {
      this.channel = this.socket.channel(`user:${user_id}`, {})
      this.channel.join()
      this.channel.on("event", this.callback)
    }
  }

  handleDsChannel(handle: string, eventId: number) {
    if (this.socket) {
      if (! this.ds) {
        this.ds = this.socket.channel(`ds:${handle}`, {})
        this.ds.join()

        // Only init the event playback after selecting a ds
        if (this.channel) {
          this.channel.push("init", {"type": "events", "payload": eventId})
          this.channel.push("init", {"type": "secrets"})
          this.channel.push("init", {"type": "tasks"})
        }
      }
    }
  }

  leaveDsChannel() {
    if (this.socket && this.ds) {
      this.ds.leave()
      this.ds = undefined
    }
  }

  async init() {
    fetch(process.env.REACT_APP_API_BASE_PATH + "/users/token", {
      method: "GET",
      credentials: "include"
    }).then((response) => {
      response.json()
        .then((resp) => {
          const user_id = resp.user_id
          const token = resp.token

          this.handleSocket(token)
          this.handleUserChannel(user_id)
        })
    }).catch((e) => {
      console.log(e);
    });
  }
}

export const websocketMiddleware: Middleware<{}, any> = storeApi => {
  const onMessage = (store: MiddlewareAPI<Dispatch<AnyAction>>) => (event: any) => {
    if (Math.random() <= 0.1) {
      saveState(event.id, storeApi.getState())
    }

    if (event.type in events) {
      store.dispatch(events[event.type](event.payload));
    }
  };

  let socket = new WebSocket(process.env.REACT_APP_WS_BASE_PATH + "/socket", onMessage(storeApi))

  return next => action => {

    // Wait for, and intercept, the login event. This allows us to init
    // the websocket by requesting a token with the now available cookie.
    if (action.type === "users/login") {
      socket.init()
      return next(action)

    // Leave, if possible, the current active dataspace.
    } else if (action.type === "dataspaces/leaveDataSpace") {
      socket.leaveDsChannel()
      return next(action)

    // Switch to a new dataspace. This will join the relevant channel and
    // let the server know we are working in this dataspace. This will also
    // attempt to restore previous state to speedup event replay.
    } else if (action.type === "dataspaces/setActiveDataSpace") {
      const { id, state } = getState(action.payload.handle, action.payload.key_id)

      if (state) {
        storeApi.dispatch(loadDataSpace(state))
      }

      socket.handleDsChannel(action.payload.handle, id)
      return next(action)

    // "Commands" are routed to the backend
    //
    // See also: src/state/actions.ts
    } else if ("command" in action.payload) {
      socket.channel?.push("action", action.payload.command);

    // anything else
    } else {
      return next(action);
    }
  }
};

