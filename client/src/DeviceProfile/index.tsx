import React from 'react'
import { AtemDeviceInfo } from '../Devices/types'
import TreeMenu, { TreeNodeObject, TreeNode, ItemComponent } from 'react-simple-tree-menu'
import { literal } from '../util'
import { LibAtemProfile } from '../generated'
import { ErrorBoundary } from '../errorBoundary'
import { DevicePageWrapper } from '../device-page-wrapper'

export class DeviceProfileViewerPage extends DevicePageWrapper {
  renderContent(device: AtemDeviceInfo, signalR: signalR.HubConnection) {
    return (
      <ErrorBoundary key={this.context.activeDeviceId || ''}>
        <DeviceProfileViewerPageInner
          device={device}
          signalR={signalR}
          currentDeviceProfile={this.context.currentProfile}
        />
      </ErrorBoundary>
    )
  }
}

interface DeviceProfileViewerPageInnerProps {
  device: AtemDeviceInfo
  signalR: signalR.HubConnection | undefined
  currentDeviceProfile: LibAtemProfile.DeviceProfile | null
}
interface DeviceProfileViewerPageInnerState {}

class DeviceProfileViewerPageInner extends React.Component<
  DeviceProfileViewerPageInnerProps,
  DeviceProfileViewerPageInnerState
> {
  constructor(props: DeviceProfileViewerPageInnerProps) {
    super(props)

    this.state = {}
  }

  render() {
    const { currentDeviceProfile } = this.props
    if (!currentDeviceProfile) {
      return <p>Loading state...</p>
    }

    return (
      <div>
        <TreeMenu
          data={transformStateToTree(currentDeviceProfile, [])}
          onClickItem={() => {}}
          matchSearch={(props) => {
            // This is bad and doesnt show the parents of the results, so it is hard to read..
            // TODO fix and enable it
            const path = (props.path || []) as string[]
            const { searchTerm } = props
            return !!path.find((p) => p.indexOf(searchTerm) !== -1)
          }}
        >
          {({ search, items }) => (
            <>
              {/* <input onChange={e => (search ? search(e.target.value) : undefined)} placeholder="Type and search" /> */}
              <ul className="tree-item-group compact-tree">
                {items.map(({ key, onClick, toggleNode, ...props }) => (
                  <ItemComponent
                    key={key}
                    onClick={(e) => {
                      onClick(e)
                      if (toggleNode) toggleNode()
                    }}
                    {...props}
                  />
                ))}
              </ul>
            </>
          )}
        </TreeMenu>
      </div>
    )
  }
}

function transformStateToTree(state: object, parents: string[]): TreeNodeObject {
  const res: TreeNodeObject = {}

  Object.keys(state).forEach((key, i) => {
    if (state.hasOwnProperty(key)) {
      const path = [...parents, key]
      const value = (state as any)[key]
      const children = value !== null && typeof value === 'object' ? transformStateToTree(value, path) : undefined

      res[key] = literal<TreeNode>({
        label: children ? key : `${key}: ${value}`,
        index: i,
        nodes: children,
        path: path,
      })
    }
  })

  return res
}
