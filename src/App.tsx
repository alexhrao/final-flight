import React from 'react';
import './App.css';
import Controller from './Controller';
import { Looper } from './units';

interface AppState {
  isExecuting: boolean;
}

export default class App extends React.Component<{}, AppState> {
  public constructor(props: {}) {
    super(props);

    this.canvas = React.createRef<HTMLCanvasElement>();
    this.state = {
      isExecuting: false,
    };
  }
  public componentDidMount() {
    this.controller = new Controller(this.canvas.current!, () => {
      this.setState({ isExecuting: false });
      this.controller!.isExecuting = false;
    });
    for (let i = 0; i < 10; ++i) {
      const loop = new Looper(this.canvas.current!, i, this.controller);
      loop.position = {
        x: (i + 1) * 30,
        y: (i + 1) * 30,
        heading: 0,
      };
      loop.nextHeading = (i + 1) * 20 % 90;
      this.controller.addUnit(loop);
    }
    this.controller.initialRender();
  }

  private canvas: React.RefObject<HTMLCanvasElement>;
  private controller?: Controller;

  public render() {
    const { isExecuting } = this.state;
    return (
      <div className="App">
        <canvas
          ref={this.canvas}
          id="mainCanvas"
          onMouseDown={e => this.controller?.onMouseDown(e)}
          onMouseUp={e => this.controller?.onMouseUp(e)}
          onMouseMove={e => this.controller?.onMouseMove(e)}
          width={window.screen.width}
          height={window.screen.height * 0.8}
        />
        <button
          type="button"
          id="turnExecutor"
          className={isExecuting ? 'executing' : ''}
          onClick={() => {
            this.setState({ isExecuting: true });
            this.controller!.isExecuting = true;
            this.controller?.executeTurn();
          }}
        >
          Next Turn
        </button>
      </div>
    );
  }
}
