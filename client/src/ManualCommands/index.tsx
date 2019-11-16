import React, { FormEvent } from 'react'
import { Container, Form, Col, Row, FormControl, FormControlProps, Button } from 'react-bootstrap'
import { AtemDeviceInfo } from '../Devices/types'
import { GetActiveDevice, DeviceManagerContext, GetDeviceId } from '../DeviceManager'
import { CommandSpecSet, CommandSpec, CommandProperty, CommandPropertyType } from '../Commands'
import Select from 'react-select'
import update from 'immutability-helper'

export class ManualCommandsPage extends React.Component {
  context!: React.ContextType<typeof DeviceManagerContext>
  static contextType = DeviceManagerContext

  render() {
    const device = GetActiveDevice(this.context)
    return (
      <Container>
        <h2>Manual Commands</h2>

        {device ? (
          <ManualCommandsPage2 key={this.context.activeDeviceId || ''} device={device} signalR={this.context.signalR} />
        ) : (
          <p>No device selected</p>
        )}
      </Container>
    )
  }
}

interface CommandsProps2 {
  device: AtemDeviceInfo
  signalR: signalR.HubConnection | undefined
}
interface CommandsState2 {
  hasConnected: boolean
  commandsSpec: CommandSpecSet['commands'] | null

  selectedCommand: { label: string; value: string } | null
}

class ManualCommandsPage2 extends React.Component<CommandsProps2, CommandsState2> {
  constructor(props: CommandsProps2) {
    super(props)

    this.state = {
      hasConnected: props.device.connected,
      commandsSpec: null,
      selectedCommand: null
    }

    if (props.device.connected) {
      this.loadCommandsSpec(props)
    }
  }

  loadCommandsSpec(props: CommandsProps2) {
    // TODO
    fetch(`/api/spec/${GetDeviceId(props.device)}`)
      .then(res => res.json())
      .then((data: CommandSpecSet) => {
        console.log('Commands: Got new spec')
        this.setState({
          commandsSpec: data.commands
        })
      })
      .catch(err => {
        console.error('Commands: Failed to load spec:', err)
        this.setState({
          commandsSpec: null
        })
      })
  }

  componentDidUpdate(prevProps: CommandsProps2, prevState: CommandsState2) {
    // Should we reload the commandsSpec
    if (
      prevProps.device.version !== this.props.device.version || // Firmware is now different
      (!this.state.hasConnected && this.props.device.connected) // Device first connection
    ) {
      this.setState({
        // TODO - should this be delayed as old data is good enough to get us started
        commandsSpec: null,
        hasConnected: true
      })
      // now reload
      this.loadCommandsSpec(this.props)
    }
  }

  render() {
    const { device, signalR } = this.props
    const { hasConnected, commandsSpec, selectedCommand } = this.state

    if (!hasConnected) {
      return <p>Device is not connected</p>
    } else if (!commandsSpec) {
      return <p>Loading spec...</p>
    }

    const options = Object.values(commandsSpec).map(cmd => ({
      value: cmd.fullName,
      label: cmd.name
    }))

    const selectedCommandSpec = selectedCommand ? commandsSpec[selectedCommand.value] : undefined

    return (
      <div>
        <Select
          value={selectedCommand}
          onChange={v => this.setState({ selectedCommand: v as any })}
          options={options}
        />

        <CommandBuilder
          key={selectedCommand ? selectedCommand.value : ''}
          device={device}
          signalR={signalR}
          spec={selectedCommandSpec}
        />
      </div>
    )
  }
}

interface CommandBuilderProps {
  device: AtemDeviceInfo
  signalR: signalR.HubConnection | undefined

  spec: CommandSpec | undefined
}
interface CommandBuilderState {
  values: { [propName: string]: any }
}

class CommandBuilder extends React.Component<CommandBuilderProps, CommandBuilderState> {
  constructor(props: CommandBuilderProps) {
    super(props)

    // Calculate and set default values
    const defaultValues: { [propName: string]: any } = {}

    if (props.spec) {
      props.spec.properties.forEach(prop => {
        //
        switch (prop.type) {
          case CommandPropertyType.Enum:
            const first = prop.options && prop.options[0] ? prop.options[0].id : undefined
            defaultValues[prop.name] = first || 0
            break
          default:
            console.log('todo')
        }
      })
    }

    this.state = {
      values: defaultValues
    }
  }

  render() {
    const { spec } = this.props
    const { values } = this.state
    if (!spec) {
      return <p>Select a command</p>
    } else if (!spec.isValid) {
      return <p>This command is incomplete</p>
    }

    const onPropChange = (propName: string, value: any) => {
      const modifier: any = {}
      modifier[propName] = { $set: value }
      this.setState(update(this.state, { values: modifier }))
    }

    return (
      <div>
        <Form>
          {spec.properties.map(prop => {
            return (
              <Form.Group key={prop.name} as={Row}>
                <Form.Label column sm={2}>
                  {prop.name}
                </Form.Label>
                <Col sm={10}>{this.renderProperty(prop, onPropChange, values[prop.name])}</Col>
              </Form.Group>
            )
          })}

          <Button
            variant="primary"
            onClick={() => this.sendCommand()}
            disabled={!this.props.device.connected || !this.props.signalR || !spec}
          >
            Send
          </Button>
        </Form>
      </div>
    )
  }

  private sendCommand() {
    const { device, signalR, spec } = this.props
    if (device.connected && signalR && spec) {
      const devId = GetDeviceId(device)

      signalR
        .invoke('CommandSend', devId, spec.fullName, JSON.stringify(this.state.values))
        .then(() => {
          console.log('ManualCommands: sent')
        })
        .catch(e => {
          console.log('ManualCommands: Failed to send', e)
        })
    }
  }

  private renderProperty(spec: CommandProperty, change: (propName: string, value: any) => void, value: any) {
    switch (spec.type) {
      case CommandPropertyType.Enum:
        return <CommandBuilderEnumProperty spec={spec} change={change} value={value as number} />
      default:
        return <p>Unknown type</p>
    }
  }
}

interface CommandBuilderPropertyProps<T> {
  spec: CommandProperty

  value: T
  change: (propName: string, value: T) => void
}
class CommandBuilderEnumProperty extends React.Component<CommandBuilderPropertyProps<number>> {
  render() {
    const { spec } = this.props
    if (!spec.options) {
      return <p>Invalid property</p>
    }

    const onChange = (e: FormEvent<FormControl & FormControlProps>) => {
      this.props.change(spec.name, parseInt(e.currentTarget.value || '', 10))
    }

    return (
      <Form.Control as="select" placeholder={spec.name} value={this.props.value + ''} onChange={onChange}>
        {spec.options.map((v, i) => (
          <option key={i} value={v.id}>
            {v.name}
          </option>
        ))}
      </Form.Control>
    )
  }
}
