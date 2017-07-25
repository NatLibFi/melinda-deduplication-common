
// @flow
export type Message = {
  content: Buffer
};

export type Channel = {
  prefetch: (flag: number) => void,
  assertQueue: (name: string, options: Object) => Promise<any>,
  sendToQueue: (name: string, payload: Buffer, options: Object) => mixed,
  consume: (name: string, handler: (msg: Message) => mixed, options: Object) => mixed,
  ack: (msg: Message) => mixed
};
