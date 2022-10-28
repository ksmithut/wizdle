/**
 * @param {string} string
 */
function cleanLine (string) {
  return string.replaceAll('\n', '').trim()
}

/**
 * @param {object} event
 * @param {string} [event.id]
 * @param {string} [event.event]
 * @param {number} [event.retry]
 * @param {string} [event.data]
 * @param {string} [event.comment]
 */
export function renderEvent (event) {
  const lines = []
  if (event.id) lines.push(`id: ${cleanLine(event.id)}`)
  if (event.event) lines.push(`event: ${cleanLine(event.event)}`)
  if (event.retry != null) lines.push(`retry: ${event.retry}`)
  if (event.data) {
    lines.push(
      ...event.data.split('\n').map(data => `data: ${cleanLine(data)}`)
    )
  }
  if (event.comment) {
    lines.push(
      ...event.comment.split('\n').map(comment => `: ${cleanLine(comment)}`)
    )
  }
  lines.push('', '')
  return lines.join('\n')
}
