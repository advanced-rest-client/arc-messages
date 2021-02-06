/* global chance */
import 'chance/dist/chance.min.js';
import { fakeServer } from 'sinon';

export const MessagingServer = {
  createServer: () => {
    MessagingServer.srv = fakeServer.create({
      autoRespond: true,
    });
    MessagingServer.mock();
  },

  mock: () => {
    MessagingServer.mockList();
  },

  mockList: () => {
    // http://api.advancedrestclient.com/v1/messages
    const url = /^https:\/\/api\.advancedrestclient\.com\/v1\/messages*/;
    MessagingServer.srv.respondWith(url, (request) => {
      const result = {
        items: []
      };
      for (let i = 0; i < 20; i++) {
        result.items.push(MessagingServer.createListObject());
      }
      request.respond(200, {}, JSON.stringify(result));
    });
  },

  createListObject: () => {
    const result = {
      // @ts-ignore
      id: chance.string(),
      message: 'test',
      // @ts-ignore
      time: chance.hammertime(),
      // @ts-ignore
      abstract: chance.string(),
    };

    return result;
  },

  restore: () => {
    MessagingServer.srv.restore();
  }
};
