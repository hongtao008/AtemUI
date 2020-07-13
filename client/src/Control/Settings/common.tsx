import React from 'react'
import { MagicInput } from './settings'
import Slider from 'react-rangeslider'

interface MaskPropertiesProps {
  maskEnabled: boolean
  maskTop: number
  maskBottom: number
  maskLeft: number
  maskRight: number

  setMaskEnabled: (val: boolean) => void
  setMaskTop: (val: number) => void
  setMaskBottom: (val: number) => void
  setMaskLeft: (val: number) => void
  setMaskRight: (val: number) => void
}

export function MaskProperties(props: MaskPropertiesProps) {
  const enabled = props.maskEnabled
  const labelClass = enabled ? 'ss-label' : 'ss-label disabled'

  return (
    <div className="ss-mask-box">
      <ToggleButton label="Mask" active={props.maskEnabled} onClick={() => props.setMaskEnabled(!props.maskEnabled)} />
      <div className="ss-mask-holder">
        <div className={labelClass}>Top:</div>
        <div className="ss-rate">
          {' '}
          <MagicInput
            disabled={!enabled}
            value={props.maskTop}
            callback={(value: any) => {
              if (value != '') {
                props.setMaskTop(Math.min(9, Math.max(-9, value)))
              }
            }}
          />
        </div>
        <div className={labelClass}>Bottom:</div>
        <div className="ss-rate">
          {' '}
          <MagicInput
            disabled={!enabled}
            value={props.maskBottom}
            callback={(value: any) => {
              if (value != '') {
                props.setMaskBottom(Math.min(9, Math.max(-9, value)))
              }
            }}
          />
        </div>
        <div className={labelClass}>Left:</div>
        <div className="ss-rate">
          {' '}
          <MagicInput
            disabled={!enabled}
            value={props.maskLeft}
            callback={(value: any) => {
              if (value != '') {
                props.setMaskLeft(Math.min(9, Math.max(-9, value)))
              }
            }}
          />
        </div>
        <div className={labelClass}>Right:</div>
        <div className="ss-rate">
          {' '}
          <MagicInput
            disabled={!enabled}
            value={props.maskRight}
            callback={(value: any) => {
              if (value != '') {
                props.setMaskRight(Math.min(9, Math.max(-9, value)))
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}

interface PreMultipliedKeyPropertiesProps {
  enabled: boolean
  clip: number
  gain: number
  invert: boolean

  setEnabled: (val: boolean) => void
  setClip: (val: number) => void
  setGain: (val: number) => void
  setInvert: (val: boolean) => void
}

export function PreMultipliedKeyProperties(props: PreMultipliedKeyPropertiesProps) {
  const enabled = props.enabled
  const labelClass = !enabled ? 'ss-slider-label' : 'ss-slider-label disabled'
  const sliderClass = !enabled ? 'sss ss-slider-outer' : 'sss ss-slider-outer disabled'

  return (
    <div className="ss-pmk">
      <ToggleButton active={enabled} label={'Pre Multiplied Key'} onClick={() => props.setEnabled(!props.enabled)} />
      <div className="ss-slider-holder">
        <div className={sliderClass}>
          <Slider tooltip={false} step={0.1} onChange={e => props.setClip(e)} value={props.clip} />
          <div className={labelClass}>Clip:</div>
        </div>
        <MagicInput
          disabled={enabled}
          value={props.clip}
          callback={(value: any) => {
            if (value != '') {
              props.setClip(Math.min(100, Math.max(0, value)))
            }
          }}
        />
      </div>

      <div className="ss-slider-holder">
        <div className={sliderClass}>
          <Slider tooltip={false} step={0.1} onChange={e => props.setGain(e)} value={props.gain} />
          <div className={labelClass}>Gain:</div>
        </div>
        <MagicInput
          disabled={enabled}
          value={props.gain}
          callback={(value: any) => {
            if (value != '') {
              props.setGain(Math.min(100, Math.max(0, value)))
            }
          }}
        />
      </div>

      <label className={!enabled ? 'ss-checkbox-container' : 'ss-checkbox-container disabled'}>
        Invert
        <input
          type="checkbox"
          disabled={enabled}
          checked={props.invert}
          onClick={() => props.setInvert(!props.invert)}
        />
        <span className="checkmark"></span>
      </label>
    </div>
  )
}

export function ToggleButton(props: { label: string; active: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <div className="ss-circle-button-holder" onClick={() => props.onClick()}>
      <div className="ss-circle-button">{props.active ? <div className="ss-circle-button-inner"></div> : ''}</div>
      <div className={`ss-heading ${props.disabled ? 'disabled' : ''}`}>{props.label}</div>
    </div>
  )
}

interface TabPanelProps {
  page: number
  onChange: (newPage: number) => void
}
export class TabPanel extends React.Component<TabPanelProps> {
  render() {
    const children = React.Children.toArray(this.props.children)
      .filter(ch => (ch as Partial<TabPanelTab>).props?.id !== undefined)
      .map(ch => ch as TabPanelTab)
    return (
      <div className="ss-submenu-box" style={{ overflow: 'hidden' }}>
        <div className="ss-submenu-submenu">
          {children.map(ch => {
            let classes = 'ss-submenu-submenu-item'
            if (ch.props.disabled) {
              classes += ' disabled'
            } else if (this.props.page !== ch.props.id) {
              classes += ' inactive'
            }
            return (
              <div
                onClick={() => {
                  if (!ch.props.disabled) {
                    this.props.onChange(ch.props.id)
                  }
                }}
                className={classes}
              >
                {ch.props?.label ?? `?`}
              </div>
            )
          })}
        </div>

        {children.find(ch => ch.props.id === this.props.page && !ch.props.disabled)}
      </div>
    )
  }
}

export class TabPanelTab extends React.Component<{ id: number; label: string; disabled?: boolean }> {
  render() {
    return <React.Fragment>{this.props.children}</React.Fragment>
  }
}
