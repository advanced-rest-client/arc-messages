export declare interface ArcAppMessage {
  /**
   * The release channel targeted for the message
   */
  channel: "stable" | "beta" | "alpha";
  /**
   * Optional call to action, the label to render on the "read more" button
   */
  cta?: string;
  /**
   * The message title.
   */
  title: string;
  /**
   * The target platforms for the message
   */
  target: string[];
  /**
   * The message to render.
   */
  abstract: string;
  /**
   * The learn more action URL.
   */
  actionurl?: string;
  /**
   * Message created time.
   */
  time: number;
  /**
   * The id of the message.
   */
  id: string;
  kind: "ArcInfo#Message";
}

export declare interface ArcAppStoredMessage extends ArcAppMessage {
  read?: 0|1;
}

export declare interface ArcAppMessagesResponse {
  items: ArcAppMessage[];
}
