declare global {
    interface String {
        format(...args: Array<any>): string;
    }
}

String.prototype.format = String.prototype.format ||
    function(this: string): string {
        let str = this.toString();
        if (arguments.length) {
            const t = typeof arguments[0];
            let key;
            const args = (t === 'string' || t === 'number') ?
                Array.prototype.slice.call(arguments)
                : arguments[0];

            for (key in args) {
                str = str.replace(new RegExp('\\{' + key + '\\}', 'gi'), args[key]);
            }
        }

        return str;
    };

export {};