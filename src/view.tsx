import * as PIXI from 'pixi.js';
import { useEffect, useRef } from 'react';
import { BoardLocation, ChessBoard } from './chess';
import { ChessBoardRenderer } from './render';

async function createApp(): Promise<PIXI.Application<HTMLCanvasElement>> {
  const app = new PIXI.Application<HTMLCanvasElement>({ background: '#7acdeb', width: 600, height: 400 });

  // Listen for animate update
  app.ticker.minFPS = 40;
  app.ticker.maxFPS = 40;

  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;

  const board = ChessBoard.setBoard();
  await ChessBoardRenderer.loadTextures();
  const renderer = new ChessBoardRenderer(app, board);
  let selected: BoardLocation | undefined;

  app.stage.addEventListener('click', event => {
    const [x, y]: BoardLocation = [Math.floor(event.screenX / 50), Math.floor(event.screenY / 50)] as BoardLocation;
    if (x < 0 || x >= 8 || y < 0 || y >= 8) {
      return;
    }
    // console.log(selected);
    if (selected) {
      // console.log('moveTo: ' + [x, y]);
      if (ChessBoard.legalMove(board, 'white', selected, [x, y])) {
        // console.log('legal')
        ChessBoard.movePiece(board, selected, [x, y]);
        renderer.animateMovement(selected, [x, y]);
      } else {
        // console.log('illegal')
      }
      selected = undefined;
    } else {
      if (board.board[y][x].piece) {
        selected = [x, y];
      }
    }
  })

  renderer.rerender();

  app.ticker.add(delta => { });
  return app;
}


export const Chess = () => {
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const myDomElement = createApp();
    
    myDomElement.then((app) => {
      gameRef.current?.appendChild(app.view);
    });
 
    return () => {
      myDomElement.then((app) => {
        gameRef.current?.removeChild(app.view);
        app.destroy();
      });
    };
  }, []);

  return (
    <div ref={gameRef} onContextMenu={e => e.preventDefault()} onMouseDown={e => e.preventDefault()}>
    </div>
  );
}