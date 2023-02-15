const envs = {
  BROKER_HOST: process.env.BROKER_HOST || 'localhost',
  BROKER_PORT: process.env.BROKER_PORT || '9092',
  REDIS_PASSWORD:
    process.env.REDIS_PASSWORD || 'eYVX7EwVmmxKPCDmwMtyKVge8oLd2t81',
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: process.env.REDIS_PORT || '6379',
  COSUMED_TOPICS: JSON.parse(
    process.env.COSUMED_TOPICS ||
      `[
      "start-nodes-topic",
      "finish-nodes-topic",
      "http-nodes-topic",
      "form-request-nodes-topic",
      "flow-nodes-topic",
      "js-script-task-nodes-topic",
      "user-task-nodes-topic",
      "timer-nodes-topic",
      "system-task-nodes-topic",
      "event-nodes-topic"
  ]`
  ),
}
export { envs }
