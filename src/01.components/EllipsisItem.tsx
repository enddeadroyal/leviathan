import { Tooltip } from '@mui/material'
import { styled, alpha } from '@mui/system'
import { ellipsis } from '../00.commons/utils'
import { TreeItem, TreeItemProps, treeItemClasses } from '@mui/lab'

const ELLIPSIS_TREE_ITEM_SIZE = 20

interface EllipsisTreeItemProps extends TreeItemProps{
    value: string
}

const StyledTreeItem = styled((props: TreeItemProps) => (
    <TreeItem {...props}/>
  ))(({ theme }) => ({
    [`& .${treeItemClasses.iconContainer}`]: {
      '& .close': {
        opacity: 0.3,
      },
    },
    [`& .${treeItemClasses.group}`]: {
      marginLeft: 15,
      paddingLeft: 18,
      borderLeft: `1px dashed ${alpha(theme.palette.text.primary, 0.4)}`,
    },
    width: "90%",
  }));

export function EllipsisTreeItem(props: EllipsisTreeItemProps): JSX.Element {

    const { value, nodeId, children } = props

    return (
        value.length <= ELLIPSIS_TREE_ITEM_SIZE?
        <StyledTreeItem label={value} nodeId={nodeId}>{children}</StyledTreeItem>
        :
        <Tooltip title={value} placement="bottom-start">
            <StyledTreeItem label={ellipsis(value, ELLIPSIS_TREE_ITEM_SIZE)} nodeId={nodeId}>{children}</StyledTreeItem>
        </Tooltip>
    )
}