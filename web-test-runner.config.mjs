/* eslint-disable no-plusplus */
import Chance from 'chance';

const chance = new Chance();

function createListObject() {
  const result = {
    id: chance.string(),
    message: 'test',
    time: chance.hammertime(),
    abstract: chance.string(),
  };
  return result;
}

function createMessagesResponse() {
  const result = {
    items: []
  };
  for (let i = 0; i < 20; i++) {
    result.items.push(createListObject());
  }
  return result;
}

export default {
  concurrency: 1,
  plugins: [
    {
      name: 'fake-server',
      serve(context) {
        if (context.path === '/api/v1/messages') {
          const result = createMessagesResponse();
          return { body: JSON.stringify(result), type: 'json' };
        }
        return undefined;
      },
    },
  ],
};
