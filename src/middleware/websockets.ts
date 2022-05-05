import { Middleware, MiddlewareAPI, Dispatch, AnyAction } from "redux";
import { events } from 'state/actions'

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

  handleChannel(user_id: string) {
    if (this.socket) {
      this.ds = this.socket.channel(`ds:1`, {})
      this.ds.join()

      this.channel = this.socket.channel(`user:${user_id}`, {})
      this.channel.join()
      this.channel.on("event", this.callback)

      this.channel.push("init", {"type": "events"})
      this.channel.push("init", {"type": "secrets"})
      this.channel.push("init", {"type": "tasks"})
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
          this.handleChannel(user_id)
        })
    }).catch((e) => {
      console.log(e);
    });
  }
}

export const websocketMiddleware: Middleware<{}, any> = storeApi => {
  const onMessage = (store: MiddlewareAPI<Dispatch<AnyAction>>) => (event: any) => {
    if (event.type in events) {
      store.dispatch(events[event.type](event.payload));
    }
  };

  let socket = new WebSocket("ws://localhost:5000/socket", onMessage(storeApi))

  return next => action => {

    // Wait for, and intercept, the login event. This allows us to init
    // the websocket by requesting a token with the now available cookie.
    if (action.type === "users/login") {
      socket.init()
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

