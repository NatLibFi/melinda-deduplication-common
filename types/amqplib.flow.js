
// @flow
export type Message = {

};

export type Channel = {
  assertQueue: (name: string) => Promise<any>,
  sendToQueue: (name: string, payload: Buffer) => mixed,
  consume: (name: string, handler: (msg: Message) => mixed) => mixed,
  ack: (msg: Message) => mixed
};
