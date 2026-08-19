import { tasks as tasksApi } from '../api/client.js'
import TaskBoard from './TaskBoard.jsx'

// Owner (Admin) and Manager: every task in their own workspace.
// There is no cross-workspace view anymore — each company's data is fully
// isolated, so "all tasks" now simply means "all tasks in MY company."
export default function WorkspaceTasks() {
  return (
    <TaskBoard
      fetchFn={tasksApi.workspace}
      emptyHint="Tasks created anywhere in your workspace will show up here."
      allowCreate
    />
  )
}
