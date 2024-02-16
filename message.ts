export type ClientMessage = {
  type: 'createGame';
} | {
  type: 'registration';
  roomID: string;
  name?: string;
} | {
  type: 'joinGame';
} | {
  type: 'leaveGame';
};

export type ServerMessage = {
  type: 'createGame';
  roomID: string;
} | {
  type: 'registration';
  key: string;
} | {
  type: 'lobbyUpdate';
  roster: Roster;
} | {
  type: 'gameStart';
  roster: Roster;
  gameState: any;
} | {
  type: 'gameEnd';
};

export interface Roster {
  player1: string;
  player2: string;
  spectators: string[];
}