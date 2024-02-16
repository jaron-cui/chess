import * as PIXI from 'pixi.js';
import { ChessBoard } from './chess';

function frame(x: number, y: number, w: number, h: number) {
  return {
    frame: {x: x, y: y, w: w, h: h},
    spriteSourceSize: {x: 0, y: 0, w: w, h: h},
    sourceSize: {w: w, h: h}
  }
}

const CHESS_PIECE_SCHEMA = {
  frames: {
    pawn: frame(0, 0, 15, 25),
    rook: frame(0, 25, 15, 25),
    knight: frame(0, 50, 15, 25),
    bishop: frame(0, 75, 15, 25),
    queen: frame(0, 100, 15, 25),
    king: frame(0, 125, 15, 25),
  }, meta: {
    image: 'chesspieces2.png',
    format: 'RGBA8888',
    size: {w: 15, h: 25 * 6},
    scale: '1'
  }
}

const TEXTURES: Record<string, PIXI.Texture<PIXI.Resource>> = {};

function textureCheck() {
  if (!TEXTURES) {
    throw Error('Chess textures aren\'t loaded! Call ChessBoardRenderer.loadTextures() before creating a renderer.')
  }
}

function getTexture(name: string) {
  return TEXTURES[name] || PIXI.Texture.EMPTY;
}

export class ChessBoardRenderer {
  board: ChessBoard;
  app: PIXI.Application<HTMLCanvasElement>;
  pieceSprites: Map<number, PIXI.Sprite>;
  layers: PIXI.Container[];

  constructor(app: PIXI.Application<HTMLCanvasElement>, board: ChessBoard) {
    textureCheck();
    this.app = app;
    this.board = board;
    this.pieceSprites = new Map();

    const boardTex = PIXI.BaseTexture.from('chessboard.png');
    boardTex.scaleMode = PIXI.SCALE_MODES.NEAREST;
    const boardSprite = PIXI.Sprite.from(boardTex);
    boardSprite.scale.set(10);
    app.stage.addChild(boardSprite);

    this.layers = [0, 0, 0, 0, 0, 0, 0, 0].map(_ => new PIXI.Container());
    this.app.stage.addChild(...this.layers);
  }

  rerender() {
    // delete all piece sprites
    this.pieceSprites.forEach(sprite => this.app.stage.removeChild(sprite));
    // create piece sprites
    this.pieceSprites = new Map();
    this.board.board.forEach((row, y) => row.forEach((space, x) => {
      if (space.piece) {
        const sprite = PIXI.Sprite.from(getTexture(space.piece.color + (space.piece.name === 'freshPawn' ? 'pawn' : space.piece.name)));
        sprite.anchor.set(0.5, 0.75);
        sprite.scale.set(3.5);
        sprite.x = (x + 0.5) * 50;
        sprite.y = (y + 0.5) * 50;
        const hash = y * 8 + x;
        this.pieceSprites.set(hash, sprite);
        this.layers[y].addChild(sprite);
      }
    }));
  }

  animateMovement(from: [number, number], to: [number, number]) {
    const [fx, fy] = from;
    const [tx, ty] = to;
    const fromHash = fy * 8 + fx;
    const toHash = ty * 8 + tx;
    const sprite = this.pieceSprites.get(fromHash);
    if (!sprite) {
      return;
    }
    this.pieceSprites.delete(fromHash);
    const pieceTaken = this.pieceSprites.get(toHash);
    if (pieceTaken) {
      this.layers[ty].removeChild(pieceTaken);
    }

    this.pieceSprites.set(toHash, sprite);
    this.layers[fy].removeChild(sprite);
    this.layers[ty].addChild(sprite);
    sprite.x = (tx + 0.5) * 50;
    sprite.y = (ty + 0.5) * 50;
  }
}

export namespace ChessBoardRenderer {
  export async function loadTextures() {
    const blackPieceTextures = PIXI.BaseTexture.from(CHESS_PIECE_SCHEMA.meta.image);
    blackPieceTextures.scaleMode = PIXI.SCALE_MODES.NEAREST;
    const blackPieceSpritesheet = new PIXI.Spritesheet(blackPieceTextures, CHESS_PIECE_SCHEMA);
    await blackPieceSpritesheet.parse();
    Object.entries(blackPieceSpritesheet.textures).forEach(([piece, texture]) => {
      TEXTURES['black' + piece] = texture;
    });
    const whitePieceTextures = PIXI.BaseTexture.from('chesspieceswhite.png');
    whitePieceTextures.scaleMode = PIXI.SCALE_MODES.NEAREST;
    const whitePieceSpritesheet = new PIXI.Spritesheet(whitePieceTextures, CHESS_PIECE_SCHEMA);
    await whitePieceSpritesheet.parse();
    Object.entries(whitePieceSpritesheet.textures).forEach(([piece, texture]) => {
      TEXTURES['white' + piece] = texture;
    });
  }
}
