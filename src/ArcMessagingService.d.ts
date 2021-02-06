import { ArcMessagingDatabase } from './ArcMessagingDatabase';
import { ArcAppMessage, ArcAppMessagesResponse, ArcAppStoredMessage } from './types';

export const endpointUri: string;
export const sync: unique symbol;

/**
 * A service that runs in the renderer process and downloads the in-app messages from the developer to the users.
 * It synchronizes the messages with the internal data store.
 */
export declare class ArcMessagingService {
  /** 
   * The backend application base URI.
   */
  endpointUri: string;
  /**
   * @type the name of the release channel.
   */
  channel: string;
  /**
   * The name of the platform used by this service.
   */
  platform: string;
  /**
   * Handler to the data store operations.
   */
  db: ArcMessagingDatabase;

  /**
   * @param platform The name of the platform this service runs on.
   * @param channel The release channel of the application.
   */
  constructor(platform: string, channel?: string);
  
  /**
   * Checks when the messages were downloaded the last time.
   * @returns Zero means the messages were never checked.
   */
  lastChecked(): Promise<number>;

  storeLastChecked(time: number): Promise<void>;

  /**
   * @returns The number of unread messages.
   */
  run(): Promise<number>;

  generateUrl(lastChecked: number): URL|null;

  /**
   * @param url The final URL of the messages query.
   * @returns The response from the server.
   */
  getMessages(url: string): Promise<ArcAppMessagesResponse|null>;

  /**
   * Synchronizes incoming messages with the datastore.
   *
   * @param incomingMessages Response from ARC server.
   * @returns The number of unread messages
   */
  sync(incomingMessages: ArcAppMessagesResponse): Promise<number>;

  /**
   * @returns The number of unread messages
   */
  [sync](incomingMessages: ArcAppMessage[], existingKeys?: IDBValidKey[]): Promise<number>;

  /**
   * Updates list of unread messages.
   *
   * @returns The number of unread messages
   */
  countUnread(): Promise<number>;

  /**
   * Reads list of all messages from the data store.
   */
  readMessages(): Promise<ArcAppStoredMessage[]>;

  /**
   * Sort function for the messages.
   */
  _messagesSort(a: ArcAppStoredMessage, b: ArcAppStoredMessage): number;

  /**
   * Marks a single message as read.
   *
   * Note, this changes the `unread` property.
   *
   * @param key Message key property
   */
  markRead(key: string): Promise<void>;

  /**
   * Marks all messages are read.
   */
  markAllRead(): Promise<void>;

  /**
   * Closes datastore connection in shared worker.
   */
  closeDb(): Promise<void>;
}
