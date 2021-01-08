
export function joinSet<T>(set: Set<T>, separator: string) {
    let joined: string = "";
    set.forEach(val => {
        joined += `${val}${separator}`;
    });
    return joined.substr(0, joined.length - separator.length);
}
