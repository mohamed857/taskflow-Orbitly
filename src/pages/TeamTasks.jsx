import { tasks as tasksApi } from '../api/client.js'
import TaskBoard from './TaskBoard.jsx'

// TEAM_LEAD only now: every task in their own team (a sub-group within the
// workspace), not the whole workspace — that's WorkspaceTasks, which is
// Owner/Manager territory. This is the direct fix for Team Lead having no
// real distinction from Manager before: their scope is now genuinely
// narrower, a slice of the company, not the whole thing.
export default function TeamTasks() {
  return (
    <TaskBoard
      fetchFn={tasksApi.team}
      emptyHint="Tasks created in your team will show up here."
      allowCreate
    />
  )
}
