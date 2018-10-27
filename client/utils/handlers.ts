export const filterKeyEnter: <T extends {keyCode: number}>(callback: (event: T) => any) =>
    (event: T) => any =
callback => event => event.keyCode === 13 ? callback(event) : null;