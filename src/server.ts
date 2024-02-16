import { WebSocketServer } from 'ws';
import { ClientMessage, ServerMessage } from './message';
import { ChessBoard } from './chess';

interface Player {
  name?: string;
  id: string;
  key: string;
}

interface ServerRoster {
  players: Player[];
  spectators: Player[];
}

namespace ServerRoster {
  export function assignPlayerFromSpectators(roster: ServerRoster, playerID: string): boolean {
    for (let i = 0; i < roster.spectators.length; i += 1) {
      const spectator = roster.spectators[i];
      if (spectator.id === playerID) {
        roster.players.push(spectator);
        roster.spectators.slice(i, 1);
        return true;
      }
    }
    return false;
  }

  export function addSpectator(roster: ServerRoster, player: Player) {
    roster.spectators.push(player);
  }

  export function removePlayer(roster: ServerRoster, playerID: string) {
    roster.players = roster.players.filter(player => player.id !== playerID);
    roster.spectators = roster.spectators.filter(player => player.id !== playerID);
  }
}

interface Lobby {
  type: 'lobby';
  id: string;
  roster: ServerRoster;
}

interface GameSession {
  type: 'game';
  id: string;
  roster: ServerRoster;
  state: ChessBoard;
}

const wss = new WebSocketServer({ port: 8080 });

type Room = Lobby | GameSession;

class ServerState {
  rooms: Map<string, Room>;
  players: Map<string, Player>;

  constructor() {
    this.rooms = new Map();
    this.players = new Map();
  }

  registerPlayer(name?: string): Player {
    const id = generateNewPlayerID();
    const player: Player = {
      id: id,
      key: generateSecureKey(),
      name: name
    };
    this.players.set(id, player);
    return player;
  }

  unregisterPlayer(playerID: string): Player | undefined {
    const player = this.players.get(playerID);
    if (player === undefined) {
      return undefined;
    } else {
      this.rooms.forEach(room => room.roster)
    }
  }

  /**
   * Create a new empty lobby room
   * @returns the newly created lobby
   */
  createLobby(): Lobby {
    const lobby: Lobby = {
      type: 'lobby',
      id: generateNewRoomID(),
      roster: {
        players: [],
        spectators: []
      }
    };
    this.rooms.set(lobby.id, lobby);
    return lobby;
  }

  /**
   * Converts an existing lobby into a game
   * @param lobbyID the ID of an existing lobby
   * @returns the new game of the same ID if creation was successful
   */
  startGame(lobbyID: string): GameSession | undefined {
    const lobby = this.rooms.get(lobbyID);
    if (lobby === undefined || lobby.type !== 'lobby') {
      return undefined;
    }
    const game: GameSession = {
      type: 'game',
      id: lobby.id,
      roster: lobby.roster,
      state: ChessBoard.setBoard()
    }
    this.rooms.set(game.id, game);
  }

  /**
   * Adds a player to a lobby or game
   * @param roomID the lobby or game ID
   * @param playerID the player ID
   * @returns the room the player was added to
   */
  addPlayerToRoom(roomID: string, playerID: string): Room | undefined {
    const room = this.rooms.get(roomID);
    const player = this.players.get(playerID);
    if (room === undefined || player === undefined) {
      return undefined;
    }
    ServerRoster.addSpectator(room.roster, player);
    return room;
  }
}

const state = new ServerState();

let x = 0;
function generateNewPlayerID(): string {
  x += 1;
  return 'id' + x;
}

function generateNewRoomID(): string {
  x += 1;
  return 'roomid' + x;
}

function generateSecureKey(): string {
  x += 1;
  return 'key' + x;
}

function handleMessage(data: ClientMessage) {
  console.log('received: %s', data);
  let response: ServerMessage | undefined;
  switch(data.type) {
    case 'registration':
      const player = state.registerPlayer(data.name);
      const room = state.addPlayerToRoom(data.roomID, player.id);
      if (room !== undefined) {
        response = {
          type: 'registration',
          key: player.key
        };
      } else {
        state.unregisterPlayer(player.id);
      }
      break;
    case 'createGame':
      const lobby = state.createLobby();
      response = {
        type: 'createGame',
        roomID: lobby.id
      };
      break;
  }
  return response;
}

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  ws.on('message', function message(data: string) {
    const response = handleMessage(JSON.parse(data));
    console.log('sending response ' + response);
    if (response) {
      ws.send(JSON.stringify(response));
    }
  });
});
console.log('Started websocket server on ' + 8080)