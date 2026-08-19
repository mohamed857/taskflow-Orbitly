import { tasks as tasksApi } from '../api/client.js'
import TaskBoard from './TaskBoard.jsx'

// Task creation/edit/delete lives only on the All Tasks tab (see AllTasks.jsx)
// to keep management actions in one place instead of scattered across views.

export default function AssignedTasks() {
  return (
    <TaskBoard
      fetchFn={tasksApi.assigned}
      emptyHint="Tasks assigned to you by a manager or admin will show up here."
    />
  )
}
