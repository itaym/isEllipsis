import { useState } from 'react';
import { useIsEllipsis, EllipsisTooltip } from '@isellipsis/react';

const SAMPLE =
  'Was it summer when the river ran dry, or was it just another dam that held the water back for the fields downstream';

const LIST = [
  'Short one',
  'A medium-length label that might or might not fit depending on the column width you choose',
  'Antidisestablishmentarianism and floccinaucinihilipilification in a single breath',
  'Tokyo',
  'The quick brown fox jumps over the lazy dog again and again and again until the box is simply too narrow',
];

type Mode = 'single' | 'clamp';

export function App() {
  const [width, setWidth] = useState(220);
  const [fontSize, setFontSize] = useState(16);
  const [text, setText] = useState(SAMPLE);
  const [mode, setMode] = useState<Mode>('single');
  const [listWidth, setListWidth] = useState(260);

  const { ref, truncated, overflow, axis } = useIsEllipsis<HTMLDivElement>();

  const boxStyle: React.CSSProperties =
    mode === 'clamp'
      ? {
          width,
          fontSize,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }
      : {
          width,
          fontSize,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        };

  return (
    <main className="app">
      <header>
        <h1>
          <code>isEllipsis</code> playground
        </h1>
        <p>
          Resize the box, edit the text, load a big font - the readout is driven by <code>useIsEllipsis()</code> from{' '}
          <code>@isellipsis/react</code>.
        </p>
      </header>

      <section className="panel">
        <div className="controls">
          <label>
            Box width: <strong>{width}px</strong>
            <input
              type="range"
              min={60}
              max={440}
              value={width}
              data-testid="width-slider"
              onChange={(e) => setWidth(Number(e.target.value))}
            />
          </label>

          <label>
            Font size: <strong>{fontSize}px</strong>
            <input
              type="range"
              min={10}
              max={30}
              value={fontSize}
              data-testid="font-slider"
              onChange={(e) => setFontSize(Number(e.target.value))}
            />
          </label>

          <label>
            Mode
            <select data-testid="mode-select" value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
              <option value="single">single line (text-overflow)</option>
              <option value="clamp">two lines (-webkit-line-clamp)</option>
            </select>
          </label>

          <label className="text">
            Text
            <textarea rows={3} value={text} data-testid="text-input" onChange={(e) => setText(e.target.value)} />
          </label>
        </div>

        <div className="stage">
          <div ref={ref} className="demo-box" style={boxStyle} data-testid="box">
            {text}
          </div>

          <dl className="readout" data-testid="readout" data-truncated={String(truncated)} data-axis={String(axis)}>
            <div>
              <dt>truncated</dt>
              <dd className={truncated ? 'yes' : 'no'} data-testid="readout-truncated">
                {String(truncated)}
              </dd>
            </div>
            <div>
              <dt>overflow</dt>
              <dd data-testid="readout-overflow">{Number.isNaN(overflow) ? 'NaN' : `${overflow.toFixed(1)}px`}</dd>
            </div>
            <div>
              <dt>axis</dt>
              <dd data-testid="readout-axis">{String(axis)}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="panel">
        <h2>
          <code>&lt;EllipsisTooltip&gt;</code> - native <code>title</code> only when clipped
        </h2>
        <label>
          Column width: <strong>{listWidth}px</strong>
          <input
            type="range"
            min={80}
            max={520}
            value={listWidth}
            data-testid="list-width-slider"
            onChange={(e) => setListWidth(Number(e.target.value))}
          />
        </label>
        <ul className="list">
          {LIST.map((item, i) => (
            <li key={i}>
              <EllipsisTooltip
                className="demo-box list-item"
                style={{ width: listWidth, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                data-testid={`tooltip-item-${i}`}
              >
                {item}
              </EllipsisTooltip>
            </li>
          ))}
        </ul>
        <p className="hint">Hover a row: a tooltip appears only for the rows that are actually cut off.</p>
      </section>

      <section className="panel">
        <h2>
          <code>&lt;input&gt;</code> value &amp; placeholder
        </h2>
        <InputDemo />
      </section>
    </main>
  );
}

function InputDemo() {
  const [value, setValue] = useState('A fairly long value that will not fit inside a narrow text field');
  const { ref, truncated, overflow } = useIsEllipsis<HTMLInputElement>();
  return (
    <div className="stage">
      <input
        ref={ref}
        className="demo-input"
        data-testid="input"
        value={value}
        placeholder="…and the placeholder is measured too when the value is empty"
        onChange={(e) => setValue(e.target.value)}
      />
      <dl className="readout" data-testid="input-readout" data-truncated={String(truncated)}>
        <div>
          <dt>truncated</dt>
          <dd className={truncated ? 'yes' : 'no'}>{String(truncated)}</dd>
        </div>
        <div>
          <dt>overflow</dt>
          <dd>{Number.isNaN(overflow) ? 'NaN' : `${overflow.toFixed(1)}px`}</dd>
        </div>
      </dl>
    </div>
  );
}
