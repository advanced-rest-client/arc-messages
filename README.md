# ARC messages

A module containing the UI regions and the logic to render the ARC in-app messages.

[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/arc-messages.svg)](https://www.npmjs.com/package/@advanced-rest-client/arc-messages)

![example workflow name](https://github.com/advanced-rest-client/arc-messages/workflows/tests/badge.svg)

## Usage

### Installation

```sh
npm install --save @advanced-rest-client/arc-messages
```

### Reading the messages

```javascript
import { ArcMessagingService } from '@advanced-rest-client/arc-messages';

const service = new ArcMessagingService('electron', 'stable');
const unreadCount = await this.service.run();
const messages = await this.service.readMessages();
```

## Development

```sh
git clone https://github.com/advanced-rest-client/arc-messages
cd arc-messages
npm install
```

### Running the demo locally

```sh
npm start
```

### Running the tests

```sh
npm test
```
