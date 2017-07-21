
// @flow
export type Message = {
  content: Buffer
};

export type Channel = {
  prefetch: (flag: number) => void,
  assertQueue: (name: string) => Promise<any>,
  sendToQueue: (name: string, payload: Buffer) => mixed,
  consume: (name: string, handler: (msg: Message) => mixed) => mixed,
  ack: (msg: Message) => mixed
};
