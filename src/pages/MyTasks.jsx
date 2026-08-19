import { tasks as tasksApi } from '../api/client.js'
import TaskBoard from './TaskBoard.jsx'

// Task creation/edit/delete lives only on the All Tasks tab (see AllTasks.jsx)
// to keep management actions in one place instead of scattered across views.

export default function MyTasks() {
  return (
    <TaskBoard
      fetchFn={tasksApi.mine}
      emptyHint="Tasks you report will show up here."
    />
  )
}
