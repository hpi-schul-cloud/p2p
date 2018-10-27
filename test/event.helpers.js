function ensureEvent(eventName, done, assertData, assert) {
  function eventHandler(event) {
    document.removeEventListener(eventName, eventHandler);
    assert(event, assertData);
    done();
  }
  document.addEventListener(eventName, eventHandler);
}
