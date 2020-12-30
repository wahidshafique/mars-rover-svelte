
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var img = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAAHdbkFIAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyFpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDIxIDc5LjE1NDkxMSwgMjAxMy8xMC8yOS0xMTo0NzoxNiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4RUYzMTg4ODEwNzExMUU2ODI4NkY0OEEwRkM4MDI1NiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo4RUYzMTg4OTEwNzExMUU2ODI4NkY0OEEwRkM4MDI1NiI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjhFRjMxODg2MTA3MTExRTY4Mjg2RjQ4QTBGQzgwMjU2IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjhFRjMxODg3MTA3MTExRTY4Mjg2RjQ4QTBGQzgwMjU2Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+v1PJmgAADjZJREFUeNpifD7N4z8DEvj95y8DKwsznM8EIr7++AUXgEl++Q4RYwIz/v9DNoSBk4eP4d/fPxAFPJxsQF0sKAq+f/nEwMfDhbDi9x+IapBV33/+Zvjz9x/cChZBAT6GJz/EGH4zsgPNZmAQY33JICTAy/Di1VsGCTFhBpbLLzhQjL/3SQCIGRh4OGUZPrwGmvD83RcGv5Z1jDAFx7qi/yN7EyCAGNHDAWQ3yOEo4QBWyQRhwiRBCv///w9R8PrdR4bPX3/AwwCsgeEfAyMjIwM4AESF+MGCf4HeA4UBCHBzcqBaAQ6gX3/g7L//IKHLAgoDiN3AcAAGnoToN3AYMAPdJCzIz4AaxkBw5hHIi2JgDR8+AK249+xdg2nRIkbNzNmMF++9eICuASAA4WSzmjAUROFz82dTrRTiRhDsoouu+ia+gy/h87jt83Tt0oogSFLTmz9y48wkNLem4GwGAufON+dMfn3gtVxHIRz5skmuUwq55ciJ7SHwBl5x9xiWeWzz0iSWQEedyBbbXnJ30GBYFByLy6qW6bdlTCviIY7rtk4WZSWB6LwQIq6Szpuns4BxmZa7ppMTi0nr8YfX5RyfXw7e3wxKeigIfOyTAE/qiIsuBNXGtr3wYrUg6/sIJuGjBbtAqgrEefer+A2W0xSHLIJplOT65xLOlwy7w1lO5r/KKoW9nrXi3q779bFZbamto2mI53GIU/KDb1rNN/XLVQDKqiUpYSgIDsnjF2UBllhutCxdeABPwQm8h8fgLKy8jC6oYhcLKFJUQIUUgZmQfhnykJJe5nVepmemO44fyoA3tXYNDyQQtSXwot4DCR68I1MxIOEAsaFh8lELZ5XseQFvrOdVCjNon0u0yEqXIRzNK5Itd3VR2pZ0JGpJ4Nk9QHPg+oNAqbhDAk8g5rN7sE7cnYeMck/0ub1gHi8PypPyIQEypTd6WlmV67z7ASeILo8Tz0qArGONNVUeUbi6pqeblFp5Ss9/fc7tTZZdZThmmqVd2vBuf479IvwYYUz0zHn4w/ZuNups6ZTG0yg7a/Gv5SJoUrz4JiMG+Qsfk4C/grn79HJ3ZZ/TMhPupuop7O1ed72Aroudv6LFOXeSGYYRvfbfHR2Dt9594vmjx9v2yQv+mwdbcWTnssGjrNEwnMnjEX/4YScA7VWXkzAQhKelQAUDxIAxMSr64Dl49wD6pkcw8RqaeAUffTTGd27gDcSImogKAtJSWqgzA1u2bis10UkaUtLu7M58P9NAD2SmRbXspyD1FniKe4dUTgh4qAQyU4n2g6EbuRARcjS0Yey5yiKZdIqvqJAPJtZ00Gpc3BBJSggF5OdxJ4jj46IgizJSPnsYASVvZtjzBJbYlvJmmpOHy+rhqQyFu1EbzJhLkDLmNHVHDnh4MUxRcUw22el636szGwXDIvHW6QbmSglpg6LUsuiKd6g1jm1Ny2sPguSi97JIyUGtWWhK/x26imiPd0xVSOKWcXNLYiFQUesFchzVNzk5/S5lDW4XTazUSjHiUVh4P/H9wJ1yZoScy3Mhjd6kut3eJw9bysNI1eU8jT59VZEiGCQSUg45OeFH+C4fb3tjDW6bOjw+aKzaAHP5Wy0YYLkz8CGd33qE7CLslm1oPr8ikLxgRKAqaBE+rGhKdr4xw8mso8rHK2qQXO4z+hdbSnoLCnkbOpaGvjVfo7oygfKyHzJEqm7bMqA1mG4mm5pAqTz+2c+SxHNXldf7to4X1w92yhonpQ+nEAXHOjiWrrLgr0OceCELWh8D6Atq+X4d61KfgauOeCnhn8d4U+OvLJTTzUoxVv9/RcO7p/ej/bObiwTPXsVYbYPaXinmoJDLJkpK4Gu8dFgztP8o++XJ3iFWq4pEq0lEPT84vVYO8SUAb9ay2zQQRa8fTeI6jptHCxRVyg8gxBfAB1CJZbf8QYVgD1tYIP6AJWLFgiUb/iASEkLd0UJUpbRJkzSRmzZmziSTjMczIUlbRrLUyrFn5s69555zfGUolhFRBqGFkVCFVpQzzlqATBzr1ykEq06PLtQLPOVhMTnvgp7PCQnarmkRYqGmKF1Iug//R2P9O1mATJcyioa5GEzbrmmYiMykZSt0T0CxrXuJWl6XbAHLMCL5WIfSEYL6id6QAqLVBZNo1sCGsmwz6snIuZLKGjQVE/MdXF4mcmOeoZOlYsAHcdGzdX0aXABJJVN125BksoTVEVgTJedmC85GdmTAhnCBZAiqrgudnFQDiQPKiSr44MlpZ3YZYiXCJiiFQaIqMKnYuXw8ECJCASdIqKQb8A4doxLh5zmgUnI8VF4rpJiNHCVMjlIVzh5/Ya874nHKCANfyxOxabzD1YGHLhHl8E9xYppc8XBoDrNtZkmpzDhutel/DltHq5E4OlIqa/FIYyUuxQdMN9rdHgeQSjFM3cNRQ1xmlaTCuaoCNCFgNXhgpGRIRt3ksqNvEic6OM8YwMjl7qRFEy2IXZfCghERRaI74/sCZNRWjOSGaOlHs4/KhWGOsK2x+s9lM7xsEH5d/1/1ctwigj00rzRHL5DLUCioRA7gxUMrw12gjcBjhHPkeA0YHK+MgQSBanQztJFjSspxqMXQDbvHTk3RUm1MERksSkC8m2dE0s369P1w9MNGx2aXcJltpvuTH0lOI5fuFhwqF236WT9ayMqRFwU+gKR1K+US1X45Rpc6r6mT3+0sFT2btu5UeLmKj0JiNBmWqGWMnd9aL02rJjqnXj8i1zT5v0azv0K9c9Y34oj2TqbF5FgxPdgqcIELm5FHyPe4qN37400s99WVLLt8cq8CIpBX3X6ykuF7IpfubeZ5I/JYfkET/jjKpDQnLvemIPZb3aHN0KODs1ziQ8PcQHQdA8J11uQ3voClegEMBwEU/LMT+xuaIfRzN7cAWCaHzbMRdWbKmBVNjWmhFoteq9OLagy9HsWW9VI8tFkOaD30r2cBcKspppbt9Ks7r7+YrLGv7Ho1UcTPt9/Wjzu7xbxHpWD5yIBXXkkdQwXHtv0ejeh20Z80tCTzSUv2/cYpNbsgr/Gna5HnH19sPxyODQ0Q2EByV2HPg0MeHMnBjXd33nx+N7ffv8j48OzxfcumJyxnqiyfqmMcxreBp7rf/xWgfGvZbRoKoteOE6duQkpRS0Go6oIP4EcQO4TEb/AB3bJB/YQuESsWLPmIsmDBjg0qiFdK3nUezBl7qhv33ms76SPQkUJAJLFn7jzOnBmf4wcY6RZgDFABbd1wWTHNKphJq9q7qktLA/Ajncg0dmLkcyblk3WKiRpTbzKJT0u3jwIrBXCVVV4MmW11kM7ghjw1z3SIxlIElke/mWzzbsM/aMowtqgRXlJhnRs2vWvMEwTzLO1UyzBNWQ9Cdgk1hCokcnYnAYg1cN0MrCYtMAwK5V1uDx7HrwQqHg2Nk60ikkDp6lKhg2akSqeuHxRjQDKAn0J10cMJRtBIVOiDMESRm4L7D3udSy/fOE0cjCtMZYlE56RMwDkXjaHhWatcO2Q531ZY+FDE+5gSOdoV2+xkzgC2kWURwUUmdBFclF+GRk7GWc6KQjkjXFvPPfUi3gW3r/kVHHnu7wHzBUmvHRvnaVDqTzfBaPpyT1irchsE74gtyVJ6c5vyOmcnoVNfb1pOdapG/a7zIHqDIbdhWAORfTWXnLFjOofL4zOtx4c1N241VJvaq0lG+SxplS2dMKiJjIBRZZlLr/M4ERCbYdSg6/pzeQVzaJNgcaxPiuuOl+dtwszNzSsly/tpi59lVGEENLFgbbMNsF46WYnRmI0J1zclJp1YlQyu13ucdG0N3hVwJXFNBqJ6yC9hlDu9/pzx8k7fiARXRZAXcPpXzk6aXLbsIsBFyFUoX6gMjulGsKAm8d+I1pxM2CJQdaUoAScNRFlWCC/EbXM9Mk5f8lBbL6UZXN8V/K5TzrbPIfcgqaGRk4RomjwtZABZYzEphKRTxAgmyApSGFVCp7H1CuGSvGatzLCxlAfAaxECYLGXbXWlKuDUBGYjtOS0UYl4tcqzVxyd5dbhe5kQDfQhg3R6iM/1qM771adxoDZbtcKubmt1ywquFzmuKXtKCBEpazBW3hoJDC6JHV4U6OQDlMd8AnQu5hpVKrGbmSkN8MAImOA0nhsTggbGMnqtWuUFq2w9HhBgkWRqQ4QLJbG0ycFIKgh8J1ocGOZqgZAPADgtAjx9cggscU0MjC6I92a9rjYIbt7eJOtp1+uMKqoX++p7t8Kc+Vytpe/tbnhqZ7vOM5df7T/swrLaFhgmTGUlzPl+JTWUvu3KBsDJPdi5o6YECT4e+8q1xwWjtAmYtQf0mV921vFcpqbvff6dLJvca454TIJq0v/68wyayuMbcG0OGS8Z1fvMDAXck4zH5bCBeCU3bZNJuouYJF5JpF785vns0ze34i4pYgCTtMKx2m5gbzGD78kDEX64n87Q4/+/35qqKM27+tjHpjQ8GVO8eOKp4dhnzw2DqTJF2sLzqWUFkz68uoN8yqydbsNvN6dq93aDFexSCe72kj4BOafVbPA4E0p/6dSMK49Ll8HrFhmf4kQfbkWUU6KUAvPUcQml/1kD6Lko+/DFpTVD/7vceANYQ+DHSV/10ic/F0F/jXqNSZHkvbraBkieBBpqAGF2RH8c+so78v3B0dOX70/K/jBmdL8r2N31HtHvPUreE7lLmXzrVrQUArwwhhkPGtH7Z7rJA98fHi6ibFlJx7r79Nc9/BvTVLwW8ZSySRCg6KQ/4ke/cPArwUq8fvH4ifJm+7qXoDEDcYKXi+i0GUCw/0lvyArH8yjykErJwbNX7z54qxqbqZdQCPEK/F7pH5ipNkIZDyLMpuotlDWGgG0r/abIX3ObJkHHVKKBAAAAAElFTkSuQmCC";

    var img$1 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAAHdbkFIAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyFpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDIxIDc5LjE1NDkxMSwgMjAxMy8xMC8yOS0xMTo0NzoxNiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4RUYzMTg4NDEwNzExMUU2ODI4NkY0OEEwRkM4MDI1NiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo4RUYzMTg4NTEwNzExMUU2ODI4NkY0OEEwRkM4MDI1NiI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjhFRThERjMzMTA3MTExRTY4Mjg2RjQ4QTBGQzgwMjU2IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjhFRThERjM0MTA3MTExRTY4Mjg2RjQ4QTBGQzgwMjU2Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+jPbtewAADo5JREFUeNpi/P//PwPD2pj/L169ZQCB33/+MrCyMDPAABOIYAxZyggTgEl++f4LoQAdcPLwMfz7+wehYH+VRT2ygu9fPjHw8XAhFLz8LdogISbM8PXHL4bvP38z/Pn7D24FI8iRjIyMDNenp/6H2P2TQZDhCQM3BxuqGy7eewG34j2DDMMHRlmGJz/EECbAwLrKgP+yonwMPJzsYNMAAgis4MV0z/8wBSC7eTjZUMMB5EBGJohtMEmQQpBmsOiv378ZPn/9AQ8DsOsZ/oGthij49Rus8y/Qe6AwAAFuTg6EFbff8TBwAQW+//oDt/vvv38IBX//MzI8+yEK9JoM2D0gwAx0E9htyAEF8hbEoewMsECDB5Rm5mzGu8/fP0CPOIAAApsAAgdqrP5ryAgwAP0G9smPb18Y/kPd8QPoNg42Fgb0sALRcANAzvi/JhqcsEC+BUUoO5ImXAAlPX35+g3qLgaw5l+//4JtRwf//kEsBVkCN2BFqe9/Hm4uhm8/foJDCBz+wOQNcjpIA8i5oKAF0d+ASQ4EWJiZGFDceOYRM9BvKgyglKgq9JmB4e0HuH9hSQA5nWCEAcgV+koSSAp+wtlS/P8YPv3ihBjC9ofhxce/qLGAnGSBBs0HJvgECUFuFL/D4hfZcKwGoIOVJT71/xkZG0C5CBZ9oOzH+u+vAkAAwqptNWEgiK6JURIijUEpwSdbH3wp+Dl98Ivs5/QX6g/4JPhQS0XUlHorLVHB7uw6m9nsigNhE/Z25syZE3GA0EDrzroZe5PmbgiJagBbAlWP5QLGqfHAwX61nJfxbTTVbIMG3ZxxbcAYVD1R7jK9RR3A6+zzBcWAm6ntWZ1NCkYSC0TRLodIv7faWkPsmqFYKtOMc7Jdp5Qj6HUS02MvaRQ5ofPqgN0p0OABfEwBSwnc4LvBwWrvsKfuA4sjmS/oC1PAtGzEKg6y44mNUyndoBKykM2tsIvNpBDMvvZq4vfoCl+H5+A1GFYY2xzNuhnXdO8fDvrnuOYbnQjRily2zSTgJPxjk9QxdfC52PQW6x8rdNwM8bH2zF6gAb7wmNSvtvKB8wVudfUf+/zyWnpfziNu4zdN1YqgGIAIxvt6KL6XMs0pv6j9LwDv1e+TMBCFj7ZgAZFGCAZRJCTqoImYOKgLxhkTR0f/BhMn/wAHJ/8DZicHd3VyxNHBhBg1JqhRY7S98st7LVd612vVkPAWmkt79+57733fh0Motpivl6OqcrG6kEe3d0++HMAHsDe9kt83IBWyLAXLwubh1aWBm9WHxgcqTk94rIeshIWbR8IyQ9zuAOqAfnMLLybPsAZqwSBAoTw/WOtuLBcRJbhBAg4BdICuYHtqbjyT5Bf87IpuGVGjDDpNE6OWac+BRBhHtUS2RZBSPOhIvgf3VBoOjKthB2o36dLkTENHWLffx/qXczitvZuk3AHsLkRAG1XZVifY8TfniQmsqYg2ofHcHMyjKYlGpjQ7iQxs/qs0vG/5awhLABYlPa4R/VICD6d+x6Zv2/8AKzukathlsvyQ0RTu5duEtk/KWk7NovhwG+U1bE2GqBFFZYr1egcSoM+0f6juihKoPr5+7uZSCWYRJOLmOYayYzJKqm0O9g5qvLxZ8EPXB2mQu38Yc+fmAdIHdTI6hfmptE8JsHB9JQ+epdWzIOzddN1AZieEkvERVLuXLOPPeDuPQdyrLCE5dD2XS3k63i8BkfKwlN1XIc9/hCCDScVkcSZjjdXQE+CSqZOfQoLUNaPFh5+AN6FKjXxZihDLCX4erOdvCYBda7x/o063O3gCojjZ3yqTgdgm7FDqb45Od47Ojvl3fwQgzlp2m4aC6PjmadK8ILQCRTQIJCohRHdsC2LFQ7DsDvgDpFZixwaxQ4hPKFskVrBvl4hVygoJCaJSlVJonffLScwdN9cZX183TkthVlYU28cz4znnjB0Aq0+vXc2eSBQvF6Zh16gEvhmdiCh1Vdox0CS88ezjernehghnrHa376jacZmh73g8gC8dM4qth8UvW1DIT7t4O6onbEGCtHsQCD+gmCVqX+yR3e15AVx//uE1ZkGOnjmi3SCZUJUIZZtLog1Hsa8emEqMnrbPAfg5lKD9MSDNjo5PcIMCgLW2vVv7K28DZiXGRYxcGdorXgDcNKv2E5hC2phBA+eCsOdy4H2UbVuutyCi9Wx265DaMZ8moxZWZSj9JLlr2eIkwNLW7BRZ++jD5ESaOtpUJtGAtFGFHtyr1CZTRPFoxEGMNxVPTrlejFT7SagI7ZkuPSgrYZp+pSDRGNxHUdoeqlyhbGhf4M1x9gs5Zl+wWd+31VKkkwmlTsT04zVU8B5nuMfdJgDk9EedXcdIplsEjCfNB6gkBv85XADePLmZbodnHOr0C6x9p9v7KwDcJRjo84xFhpK6A9V6A3JZr6nAUpu4FJWaCusqUosATTL/0VVFpTWVJwOcmhd0XusNQ4O5C+eUN6fDyM+cyDbO3TdjfAHa6J1aBHKJvrOmbjS59+NOCcsiGj00bCwxZGQqRmbEdWCr05ugBEMAGN/24s4sYJrOTUkbtHplovriWgm5gL6GKIAaxCW5ShC2BivKPTXX8CVDh2wm5eJ8vPA4L4jTlC7Q8fwYKY9n5ys2TDqZhjTmTjc9vxnlKm86c6LsiKZVDaLSTrlRyOdSSgCftqIeaT2fT0EaBvD1+0/AJhbn4RiWX2fUGbjgx48qv4yqFwBjrflaC8r9AyabHMXNEJxNa3Bx9gzslWtwMpP0eMdqow1JfnOjyeDzBrOnaDIW89nbL99ZZSG2cKUwE8hc0LjET/lRi9p9M6JxC2amurBpWNAyNbUs92wbl+8aLKRlZBDjAPiZEj9P6csFiy/eZXmHl+gXumPnAsXK9DzuCxDExk7lWAAE+vSCJDUY6GU8lpfARy1BIACkL+6hx8PjfC7JB0r43wIQIT5G2Zt77oipi5oEABLboQA4QJZuP7AYW8HjUykdMon4WAA4X3arLajZTGoVjwRAxNulW7OmFiry8mTEb9kp3aFkZMzfVdcIX+EN/ujQJRi3G0Bdwa+6QBioBH3r1eLL9+vy//8IUL617LZtRNHhQw+Ski1FDpQ0qKEARRdpF1nGqxj5ggD5gXxCt0032XRZIH/Q/EI3XbbadlWvsuoiRdE0RdNYkiVKskSy9ww18nD4GqlW3SQDEDJsgeScua9z7nVCoJAz1o9P7n1LPzxGRwtF6tnYZ6OzSaLQvKyXFl1BdSFrVnIKmUsPAyoAXDR5cvQzHevdz2932UHLY2N/xl7/dcqLHzsjUcbjFAFbEjcJFpvTSJGhtxVbBJAQ99WyBdmDd82V9y4EgIPw1REaV617dz5mdXohaOiDHKanti1A2GTWqLPwPgBik82rFlShTapDDLI6fSEY2+W0iEq+x/j85fe4eVSvVXPZJnQcbAD0GPx8081flNIV7Y3H/YGk+4CMqIWqcCWwbFgIyAsq5lIAHnz903eEwsmboU8uEG+oWs1+QZj/bHKWoOe7WACZs65lfsmoFkwwfWzaVdzD1owUA8isAKHh1q6aS8e0IkcPxckvKdch9eh0lPUAiFif9n+8DIJ1XhOfQRStuVGYEU/gZ3LPP7MitIg3OV55bJiUC4fITlXTwpGX3g/kUFMaiQYyD//zzelafeKIw+cyNo9CIG/zgSQaCNfJW2A0RX/HvUaUpiHFTaYz7YyjbQFRZJ7AklpU3YDLicFAWbRSoyyCTZYYAcDEMJec53EiCJw1t0GnaCbAQR86a0G98WnDMvZl1iaUuaJ+ZYbPhXdBXeLue3aAQ+Tmm5gvuTXA9LMCkyysiugtFztzf8yqjkvWZfNgWtQZcOs1fgmmeDbxE+CVnf4GQdB4yCv/TvNi5i8nOMmd4ZRL2FauRJUAaurzuBAGgXZgRGrutPa0mwfaAPzw5dF9+jju3Wj/p5F+k83vjJLz02D2U5h+7+a/B0AULlnV51Utu4xZDZbs2GB1Bo0Tbm2RaSLawuSanpupvpeVq0g/soCWl8/FyFHREBe+B0AR1MB1BbZFrqhtAXTPNb998YfJUHg5FHQOb3V50IF+LqezTdgeRGC1fSlGf8XY7zLn3mJqSXyP34ueEaxqkU2axoUAGKt+O04ZQx5QIP3zuPHz2ac91j1o5/KCMqorssJ0vkgUMWIKzll1x6wMC0PG8XJOGEFW1yq1s4BMLF68tjjCVZvSou0w1wmZZ4f0c0gs7OJ7yBbjyTRzgFdL2kc/ucBFxJwSrESkNdQqamMkVTSF4bpyhcXYxRWwcYLP4WTOxHRqbBkGl34xy4QrJWRYITsk58E/DLwdjNiyQMnN6+Jqn+CK5IAc2bZZ+JxpRuujVA8QQzpCdOMmmNO6UFfbWbBuY8GrRwCRJ4DYGR2mXS152lXLBYwwfArlEUqiR74Hcw4iOjUNGnE6rfDro+aMeXud1N+9dfmK6esVKPNzNhyNuYJpmyY36cuQ3mp0aKgSDeOc31OU7qUWoOrAh9f3uA5cFvySqBc3NNYBjGLI7U7Imqvp0cFowts9iOxQeVynxq9qpcJHiwRRQv8SwKlNMtNCqq7zzIXg/WpoEtiU2pyIPwMeowWAqsrfaDfWE9mXCUAi0ldiMFylBJgtDTac2Ww8t9giNHm8adYCPtzpVpNpE2n7t1OD/T0xtxNFU4UReiSB81Lo371ui+179Z0AkKzda1v4ut4zNwJgbQ2Y6zQNiCQt5NxPbl4r1PHeOwASFhHW+5ic5EGNYsPh9f1ULn5vAUjFCMaeC/eAZdzq7PH64YMAIO0i7Bnd6Fj8DsO+7UZ9q6rwnQNAXXIalaW0awSITg/gnQcgi2YTcX0mYocApOXVUv9pswsARv6ct4dRiV4JADmAfEFPfqgyO7DCg30vltMq+u4z8mecLmOTU6nnuFrPRbf4fwFAptvEzX/EEFy9LW7xkq4+lfJ9m0X9R998/6u2C3xI6x9wCu9maWCfvwAAAABJRU5ErkJggg==";

    var img$2 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAAHdbkFIAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyFpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDIxIDc5LjE1NDkxMSwgMjAxMy8xMC8yOS0xMTo0NzoxNiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4RUYzMTg4QzEwNzExMUU2ODI4NkY0OEEwRkM4MDI1NiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo4RUYzMTg4RDEwNzExMUU2ODI4NkY0OEEwRkM4MDI1NiI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjhFRjMxODhBMTA3MTExRTY4Mjg2RjQ4QTBGQzgwMjU2IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjhFRjMxODhCMTA3MTExRTY4Mjg2RjQ4QTBGQzgwMjU2Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+Nn3c/QAADxZJREFUeNpifD7N4z8D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";

    var img$3 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAFSDNYfAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyFpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDIxIDc5LjE1NDkxMSwgMjAxMy8xMC8yOS0xMTo0NzoxNiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4RUI3OTU0NjEwNzExMUU2ODI4NkY0OEEwRkM4MDI1NiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo4RUI3OTU0NzEwNzExMUU2ODI4NkY0OEEwRkM4MDI1NiI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjhFQjc5NTQ0MTA3MTExRTY4Mjg2RjQ4QTBGQzgwMjU2IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjhFQjc5NTQ1MTA3MTExRTY4Mjg2RjQ4QTBGQzgwMjU2Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+/noidwAACv5JREFUeNo8jksOgCAM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";

    var img$4 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAAHdbkFIAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyFpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDIxIDc5LjE1NDkxMSwgMjAxMy8xMC8yOS0xMTo0NzoxNiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4RUE5M0QzMDEwNzExMUU2ODI4NkY0OEEwRkM4MDI1NiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo4RUE5M0QzMTEwNzExMUU2ODI4NkY0OEEwRkM4MDI1NiI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjhFQTkzRDJFMTA3MTExRTY4Mjg2RjQ4QTBGQzgwMjU2IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjhFQTkzRDJGMTA3MTExRTY4Mjg2RjQ4QTBGQzgwMjU2Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+eFkp1AAADglJREFUeNpi/P//PwPD2pj/L169ZQCB33/+MrCyMDPAABOIYAxZyggTgEl++f4LoQAdcPLwMfz7+wehYH+1RTyygu9fPjHw8XAhFDgYKi8A0V9//GL4/vM3w5+//1CtuHb7AcOv338ZuDnYwII/f/9h4OGEsFlAhBA/L8J+dlYU98AdCfIezFhkABBAYO89n+bxHyYAUgQzHm6ChJgwAyMTxDCYJEghKBDhVnz++gMeBhCj/zEwMjJCFHz99h2s8y/Qe6AwAAFuTg6EFZ+/fIME0K8/cLv//vsHUfB+ftD/1+8+YjiOGeomFgFeToYfQvwMuADTjYevUGIPBkCmggBAADGCvAJy7f5qy/+KotwM7GwsYJ/8+PaF4T/UHT+AbuNgY2FADysQDTcABP6viQYnLJBvQRHKjqQJpxOxigLNA2kGJYAfSCEDA//+QSIOZAmKF4Q5geHLxcHAxcGO4lSQhm/AZMbJzgJMbn9QYhRswIEaq/8a0thDEj340eWgCVoJEYFIiRk97cDEObh54XIYYcDMzATXxMTMDE9bnMAwgYk/efIENRAPnL/HwIKUlUFZCxxYf//C0x7IYBgQEUR4FyAAYdWSgjAMBU39oYKI2F2XXsKdp3Dt5TyHJ3Hhwq0iIq2i1EzNxGkTaqAU0iaZmfdmYr6mXbVqoFSihtIeoCV4MsvVcwgYPNgYVfG4QENjQ4cuftjewHtsvQ9DRFstr2reD+ZxssZetBMB7e06jWKyEmoi/hsgqAWKMQGKVKzbTcwPQZZOw4x1NJqa6He/wTJb1OABPimwlNCmmQsJ++BwPNXg4dogBdKKCeu9wJRTLWILVKPKTPbq2J8vVw8fk/Q78gCw8cSGM5NZP+1tofAp/qDfrVCgrMpdy9paRr/AOlHNpFVJ2vKOJ2Fx7GYCNbtBuZ3Ppp3haBIEh540cC0MragX6FVs892mLF5lp7jf/sZYc3wEYL1qehIGgmiBFltQoyZw0ISrJB40MRo8SfxXmnj26j/wn6Ce9MjFePAiGmMUP6P9LtSdhamzZbfW6CYECKSz++bNe28FWe/sbm1bpn6yvryo9e76uR8C3QrYhGbpBkglxVGK4c7B2SmzgcOHF1urL8xO4FnSDenDodtQWFYckwE1Xp99RroJCOCCyQByo8D9ZUERQId7GCuDQUdJQ5UkZ9G0bFoCOmHgaxF7cYiZ4pjcZCOGlD6BTvGnDUDBqmkkUFMK4+YCz9V8d5RxfNdOimPvqUjRBequ52Iqwy598rTOQDSVySYQr6aIT1JfZv1/hf5fXvV+1Zp0bsm7BASO91pHzUZt7vb+kZFmIO0bLY7OCuYIZLa9kLsMouOw78M4TtypYhpqHQBVbjbq7RlLTzLrf620MAF/0Hd5Czr7m6tm2WjX56sTxeHPcRwrBYjahwp+GX+Eu0ZhWOq2VhrJ3D8xf6pYo5gJ8AK0VJNxGuCdToZDfIv/loogU5VpLfRdHtlwY9IpoNnN0ItcRGT9Uy0Y24IkkQyiMCmeW4gKCvJgzA08RzhR1qL6gHeh4jiBXH86vpTxMm3HBe5HTwRcoXb6zZWIi5HjiRuA9gpXDNR/NHIUFrinQBt4S5iw5Ln80OLvH7YyHCZPiouDtfOLm+5Gc0nrP7+JUI8LwsnSxcOx0eBYpckHqNYyLpJfArBmLbtNA1F07NjjhLZpSltRFgixRez4gYDEvp/AJ3THByAWrPgF+AP2bLJESEhlh8QOIR4qjZI05GE7NT5ObnxnPOPYgZGyiBJ7xnPPnHvO8Rop0AIH7Wbv/t1j0R+Map1xLnVNUrCSTYQWGIxnQko/u+mEHT0Tok1nvFmjNBZRlzw9//Jd3Ll9pCBfpnoNuEDbLVuEbaF4IMIQfZ+HcXEBj168f4NdCKS6jXGUt90qO2EqEVhTPYJJNR7I/pwuYBqFW/WAdZdkdA7HR+UyCJKk9/PyKqPifx3YlSA9FXplOFaKC0hE7/fwj2gGstB4yG7VGbCk0IGmEoFfCiVIEqcHwGDLyBSXOU7d65gMpU2SYx6rJsRkWL3HLuRbx0EVMY7nQCU92B9e1YuL9EnpyaFw1xPFeUkUERpHih609ReKoQq/Oq44PbmZdrkovxE4gedWmBx0S8ledsPJeGmrtbG/t2MUKth+3MO0vLOjzo74ddG3Ijfn+pzzE7aYwja7jpU3rBiwybD/PZQFvHv2cB/1X6Q9fh5G1otQ+7khStxmeCr45OsH926Jbz8uxCgVp8Ael2c8QYkQimqgQl1pa7HAiPG/SSMWS+CIUwTBmBx1M03OychmTnQbp+LGsgNLX3AsYEoOO20jcOjpqfdzktFbMTojD2krlMDpnhzupZIs3MjvVQc0H3oBP4bkoPSk7BWyurAEeLbUY5MXBJtyGYedCfxGAQNnyPpMUkzv4wrnp0CbzKPayOcU7+rOllKoeCW/w1XEoif4xGTAAnGGrnzKBlG8CzGKL9cwCenNDtq7S3BoqI21PN7LeH6ZBHIpNlvlPwU8eH6ha4Li00UkXXD/dGUaMDH429Sg6gCQG5iGL616MkNHZ7epUK/ewRCQ246l/srJMxxJknSydaOcCeseO2w9LdwRzsYdCqcTMxNCCW8z6B2MreNtGvAebtK4fgsNGEhZ62ICFN7v6IGGnm/DH+p8QbLPffz8wyeg1q/gjFFnimSh+/Dh7piiF107wpxeDkZGUHumJwvnsww4pobTKrFf5As5eeHpaQxGY9FZHXOVCRNxTl4Amk4GTeHLwAhCk7ot64TcmmdOOl4UFxAvwu7nrxeinZ5/2DAoW650KSl16uMss+b845leXT15+XGYJ54LRdny1trSPCMwQcm3KRmpMv4KULzZ7LZVRHH83utr3/gjpOWjAhHULrqoWHWBBGKHeAD6CHmE7LuADe/BI/ACoK54ByQQQRS1lKCQJnbiOvZlfnN9bsbjmbkfscNIqSXXX+fMmXP+5/8/42TLBR9QosEIlOljVR+m0zcrxy5u4xJP1pw6ih5Vs+sBMlvBpFan/gWxSWgQn++yfd1uqTu4jOcAIf2Q+ptWZ30ijfimyDY1XrQRG9CTgkyaq1YEGPT1b+oFDz77+CPVL3ejV8cnunA7D58lW9CwzSxmsGrxe/ixTZgmO4JcPJ7JTl9nrbRaLlGF4gmPv/xZkMh2GrN5HAwgiZCjmxp/fd67jXbcPj4zB1CVaKJGkNSIOBBzpQMoVFA2x6eTSFO5KhH52m0SGNStncQ2vXCy7rqu/NjzjZXupfANLBK9HqmYR0foszhhNMiiLOutFLjbXrqt8BRkdv5KHVHalarjXd8BkXKABm0wP3dVOKVlTzRXX8KX6j8HmyByVjATKzwlunkwN4zPqrO6Sp69pMOWV34ezWFSL+TiZ86uU4WV9vgS2LkQic/4uZGR5ej4Fkk39P98FlwCrdz4oh6y9rJjjSH5MhTtLEuycZERMthl13l2hMSJopYYTsM56NBuOD+NJspg0/dV0SZIvBFJHif5A1qeO6N+EAhrI6ZXOhoIfVdiMoGyZG+z3k8n57pz63RSnUxDygBypkzOkZPOxpMV51XtfpMIOOCf998uSuD5eOJNTiFZU2utNcANnSN5wZY2ww1AqhmtuuJBJRKUhZoNJKZvBwjNlKdvowI0MX4rULjc1XlyyOP+e3vB3b8JVP0/V/AIFJPR8QGhD2t/cnoWPX95XIbcaNCv1Z/acJXyYw+luZKljByFyBZeh0NJanSH4tu6EwZeB/zw9PP7Kjd/x5c/un9Paybw5manT9LZHQ4qneDq9miqzPkLu0KElgvX2zTajSIA45MoP6LEffJoXxv/869/aEKAXbdFxDatrlQFdk2wPyBGdpvazvtcQE4qjslym4m2CUO21g1C1cZJ9AzjmaQBhLz465/aoX7biyNyWbbo69N5LmJNkOvcHh80dx7jWX+r9ne+WGzNAJ+K23TRHKVpEkSeFw5dbeXVSb7QkBedTBNqr8+3ary+VaJ+1OUGBD+aoxAKlFl9WzpLDeLja4gPhCI6Pu6EiGBAwmOWb7Z8zLqqnx72S1QlTEtPz6snlR0YTjWlMwljk9PXE8bAaT3tEG/M6QLG5Heb0tU3PCBUFfX+wmg0xmV50Ylq2F/B/CtQ1+jDtYTjSErsVJWOoMua6sNFae0sB2GbOAM0mS8WTtzBZ/G8dsCPTz/9SrM9o2JGBalQ3kTooNbK+Ned3ZFlTOyBxcXUXxvNwucQyfp8Z6ZwiP3ZaS/TlJzZD/iuIgh0L2Yn8/gxhIc0O+achIm1Q+Nnt8HkVh0xOEgUjd7OYE2zqYUDJAKarM4yzO3kctPKENrpSrrM0z5XOqBtNm5jfKLa3bTXc2qGnYZq7E24RacDNpl1XQvdK11qX/T+Lie4ooI8UOVstK+04giugCdzdpYn5KLcJu5QOI3PdspLm2bruzZZPF8soXK+knBDlDnqo1xcC9H37gjIo++Z1Xn+6jTav7cX9XeyEgeYUrjvgwRaLvJ1gtTU7WfTy9q5pa8np9RuqQrEx4WAjhgv/QdD8Hff2g2izLIK6F2I40MFg58cvTzRzM+e8iDlENDC5KxZWqCqED1kSI2mxTcfwmlqM9JrOmLYCecD0/jrTYn0rOKgn61dd3NC4S+//el3ZdEhhqAH6qqwvMZ8ZQzNwtHxZ07oYeCwmDnxkqbbWqbxOEtuTzJ9jPFFnzCr3w1ylUU9cfDww3f0UQASc7GDc5vX6AtMmNumPPL++eJaa2hCbrRZnstkhTT++OEHEfN7J/++DnqxbZdn9wSu5bsPsqn1H3o6BCGc2zAYAAAAAElFTkSuQmCC";

    var img$5 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAAHdbkFIAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyFpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDIxIDc5LjE1NDkxMSwgMjAxMy8xMC8yOS0xMTo0NzoxNiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4RUI3OTU0QTEwNzExMUU2ODI4NkY0OEEwRkM4MDI1NiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo4RUI3OTU0QjEwNzExMUU2ODI4NkY0OEEwRkM4MDI1NiI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjhFQjc5NTQ4MTA3MTExRTY4Mjg2RjQ4QTBGQzgwMjU2IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjhFQjc5NTQ5MTA3MTExRTY4Mjg2RjQ4QTBGQzgwMjU2Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+AREmTwAADrVJREFUeNpcj00SwiAM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";

    var img$6 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAAHdbkFIAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyFpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDIxIDc5LjE1NDkxMSwgMjAxMy8xMC8yOS0xMTo0NzoxNiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4RTcxRkZCNzEwNzExMUU2ODI4NkY0OEEwRkM4MDI1NiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo4RTcxRkZCODEwNzExMUU2ODI4NkY0OEEwRkM4MDI1NiI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjhFNjZCNEZDMTA3MTExRTY4Mjg2RjQ4QTBGQzgwMjU2IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjhFNjZCNEZEMTA3MTExRTY4Mjg2RjQ4QTBGQzgwMjU2Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+QXtlRwAADb9JREFUeNpi/P//PwM+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";

    var img$7 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAAHdbkFIAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyFpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDIxIDc5LjE1NDkxMSwgMjAxMy8xMC8yOS0xMTo0NzoxNiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4RTcxRkZCQjEwNzExMUU2ODI4NkY0OEEwRkM4MDI1NiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo4RTcxRkZCQzEwNzExMUU2ODI4NkY0OEEwRkM4MDI1NiI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjhFNzFGRkI5MTA3MTExRTY4Mjg2RjQ4QTBGQzgwMjU2IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjhFNzFGRkJBMTA3MTExRTY4Mjg2RjQ4QTBGQzgwMjU2Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+NyXlzgAADuxJREFUeNpi/P//PwM+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";

    var img$8 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAAHdbkFIAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyFpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDIxIDc5LjE1NDkxMSwgMjAxMy8xMC8yOS0xMTo0NzoxNiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4RTY2QjRGQTEwNzExMUU2ODI4NkY0OEEwRkM4MDI1NiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo4RTY2QjRGQjEwNzExMUU2ODI4NkY0OEEwRkM4MDI1NiI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjhFNjZCNEY4MTA3MTExRTY4Mjg2RjQ4QTBGQzgwMjU2IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjhFNjZCNEY5MTA3MTExRTY4Mjg2RjQ4QTBGQzgwMjU2Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+CGib3gAADZVJREFUeNpi/P//PwM+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";

    var img$9 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACYAAAAuCAYAAABEbmvDAAAACXBIWXMAAAsTAAALEwEAmpwYAAA4JGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxMzggNzkuMTU5ODI0LCAyMDE2LzA5LzE0LTAxOjA5OjAxICAgICAgICAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIKICAgICAgICAgICAgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIgogICAgICAgICAgICB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIKICAgICAgICAgICAgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIKICAgICAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIj4KICAgICAgICAgPHhtcDpDcmVhdG9yVG9vbD5BZG9iZSBQaG90b3Nob3AgQ0MgMjAxNyAoV2luZG93cyk8L3htcDpDcmVhdG9yVG9vbD4KICAgICAgICAgPHhtcDpDcmVhdGVEYXRlPjIwMTctMTEtMDJUMTQ6MTA6NDErMDE6MDA8L3htcDpDcmVhdGVEYXRlPgogICAgICAgICA8eG1wOk1vZGlmeURhdGU+MjAxNy0xMS0wMlQxNDoxMTozNSswMTowMDwveG1wOk1vZGlmeURhdGU+CiAgICAgICAgIDx4bXA6TWV0YWRhdGFEYXRlPjIwMTctMTEtMDJUMTQ6MTE6MzUrMDE6MDA8L3htcDpNZXRhZGF0YURhdGU+CiAgICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2UvcG5nPC9kYzpmb3JtYXQ+CiAgICAgICAgIDxwaG90b3Nob3A6Q29sb3JNb2RlPjM8L3Bob3Rvc2hvcDpDb2xvck1vZGU+CiAgICAgICAgIDx4bXBNTTpJbnN0YW5jZUlEPnhtcC5paWQ6ZDkzOTk4YmMtMzNkMC00NjRiLWIyNWQtMTNhMWNkMzJiOTkwPC94bXBNTTpJbnN0YW5jZUlEPgogICAgICAgICA8eG1wTU06RG9jdW1lbnRJRD54bXAuZGlkOmQ5Mzk5OGJjLTMzZDAtNDY0Yi1iMjVkLTEzYTFjZDMyYjk5MDwveG1wTU06RG9jdW1lbnRJRD4KICAgICAgICAgPHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD54bXAuZGlkOmQ5Mzk5OGJjLTMzZDAtNDY0Yi1iMjVkLTEzYTFjZDMyYjk5MDwveG1wTU06T3JpZ2luYWxEb2N1bWVudElEPgogICAgICAgICA8eG1wTU06SGlzdG9yeT4KICAgICAgICAgICAgPHJkZjpTZXE+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPmNyZWF0ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0Omluc3RhbmNlSUQ+eG1wLmlpZDpkOTM5OThiYy0zM2QwLTQ2NGItYjI1ZC0xM2ExY2QzMmI5OTA8L3N0RXZ0Omluc3RhbmNlSUQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDp3aGVuPjIwMTctMTEtMDJUMTQ6MTA6NDErMDE6MDA8L3N0RXZ0OndoZW4+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpzb2Z0d2FyZUFnZW50PkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE3IChXaW5kb3dzKTwvc3RFdnQ6c29mdHdhcmVBZ2VudD4KICAgICAgICAgICAgICAgPC9yZGY6bGk+CiAgICAgICAgICAgIDwvcmRmOlNlcT4KICAgICAgICAgPC94bXBNTTpIaXN0b3J5PgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICAgICA8dGlmZjpYUmVzb2x1dGlvbj43MjAwMDAvMTAwMDA8L3RpZmY6WFJlc29sdXRpb24+CiAgICAgICAgIDx0aWZmOllSZXNvbHV0aW9uPjcyMDAwMC8xMDAwMDwvdGlmZjpZUmVzb2x1dGlvbj4KICAgICAgICAgPHRpZmY6UmVzb2x1dGlvblVuaXQ+MjwvdGlmZjpSZXNvbHV0aW9uVW5pdD4KICAgICAgICAgPGV4aWY6Q29sb3JTcGFjZT42NTUzNTwvZXhpZjpDb2xvclNwYWNlPgogICAgICAgICA8ZXhpZjpQaXhlbFhEaW1lbnNpb24+Mzg8L2V4aWY6UGl4ZWxYRGltZW5zaW9uPgogICAgICAgICA8ZXhpZjpQaXhlbFlEaW1lbnNpb24+NDY8L2V4aWY6UGl4ZWxZRGltZW5zaW9uPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAKPD94cGFja2V0IGVuZD0idyI/Pt6f2N8AAAAgY0hSTQAAeiUAAICDAAD5/wAAgOkAAHUwAADqYAAAOpgAABdvkl/FRgAAAmdJREFUeNrs2L9u2kAcwPHfK3iIIhSwlbPjA9/5bIs4CpWllqRQhj5GhgwMPEZELSUoEg7MeYQ8QbcMkaosjB07MDIwdLgO9JDtmL+mplI8fBd0+t1H2IPvQJIkkCQJisUC3CAJbstHrYGNR0MH8ywa2Hh0Wz5q3aCZQXggDPtCEQwdPM4KFWrcIigZJpcKLZOgESOIM4L4j89upF9fvUjfPzqRVv0uis8V+zED/ZRLhVYEVjg88BhBk/mifcBmTQqHB54kSRBB1VyDN+tV3qxXM4OJ/WquEcEBI2gcR+0DFsONQfyN4QX7gjXr1flj/f9hnzwrUlaw+L45LIflsG1h2/Y+YS+XLh86mPtUXdrQwfzl0s0Odm+drESJ7q2T7GBi06cP5tLEuhyWw3JYDsthOSyHvUfYJgfeXcJ2dhJ/vjjdGPZ8cboVbMII4t45XQl7bZzxHtO4T1X+6BpvDh7xHl2D+1TlPabx18bZSph3Tuc3PsCwfC2UYVwSTHy5roOK48SX7CJYCMUZlq+B6SVgFaUTu0Dj3Zr5BiYezbooUfhdC8/s1sz4xR1nFaXD9BLMYGUZzIrSZgRNF+F2DUtA/TYrSpuVZYjAaFkGZhwDIwgCC3eSLnHTwpJmBhbuMIKAkeOZYRmsz3R4sHB76ODpP4RNHyzc7jMdNoIFDMPAxjB0ZgW2Dmlhga3P5w1sDAHDkAr2F5Ua5lMVBC41LITaCUzgUsH6VgS1M5hPVehb+mawBkFwRzXoUQ2+ERTJp+pk3auBhCbxeT2qwR3VoLEOrGsWF0eVK5+q0y1Q0y5VrpbNjsP+DAC5WtBNK7C1AwAAAABJRU5ErkJggg==";

    var Tiles = {
        bottomCenter: img,
        bottomLeft: img$1,
        bottomRight: img$2,
        center: img$3,
        left: img$4,
        right: img$5,
        topCenter: img$6,
        topLeft: img$8,
        topRight: img$7,
        rover: img$9,
    };

    var RoverOrientationsMap;
    (function (RoverOrientationsMap) {
        RoverOrientationsMap[RoverOrientationsMap["n"] = 180] = "n";
        RoverOrientationsMap[RoverOrientationsMap["e"] = -90] = "e";
        RoverOrientationsMap[RoverOrientationsMap["w"] = 90] = "w";
        RoverOrientationsMap[RoverOrientationsMap["s"] = 0] = "s";
    })(RoverOrientationsMap || (RoverOrientationsMap = {}));

    const getRoverAngle = (direction) => {
        return RoverOrientationsMap[direction];
    };
    const getRoverDirection = (angle) => {
        return RoverOrientationsMap[angle.toString()];
    };

    /* src/components/Rover.svelte generated by Svelte v3.31.0 */
    const file = "src/components/Rover.svelte";

    function create_fragment(ctx) {
    	let div;
    	let img;
    	let img_style_value;
    	let img_class_value;
    	let img_src_value;
    	let img_title_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			attr_dev(img, "style", img_style_value = `transform: rotate(${/*angle*/ ctx[3]}deg)`);
    			attr_dev(img, "class", img_class_value = `ml-3 mt-3`);
    			if (img.src !== (img_src_value = Tiles.rover)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "title", img_title_value = `${/*title*/ ctx[0]}-${/*row*/ ctx[1]}-${/*col*/ ctx[2]}-${getRoverDirection(/*angle*/ ctx[3])}`);
    			attr_dev(img, "alt", "rover");
    			add_location(img, file, 11, 2, 281);
    			attr_dev(div, "class", "absolute top-0");
    			add_location(div, file, 10, 0, 250);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*angle*/ 8 && img_style_value !== (img_style_value = `transform: rotate(${/*angle*/ ctx[3]}deg)`)) {
    				attr_dev(img, "style", img_style_value);
    			}

    			if (dirty & /*title, row, col, angle*/ 15 && img_title_value !== (img_title_value = `${/*title*/ ctx[0]}-${/*row*/ ctx[1]}-${/*col*/ ctx[2]}-${getRoverDirection(/*angle*/ ctx[3])}`)) {
    				attr_dev(img, "title", img_title_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Rover", slots, []);
    	
    	let { title } = $$props;
    	let { row } = $$props;
    	let { col } = $$props;
    	let { angle } = $$props;
    	const writable_props = ["title", "row", "col", "angle"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Rover> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("row" in $$props) $$invalidate(1, row = $$props.row);
    		if ("col" in $$props) $$invalidate(2, col = $$props.col);
    		if ("angle" in $$props) $$invalidate(3, angle = $$props.angle);
    	};

    	$$self.$capture_state = () => ({
    		Tiles,
    		getRoverDirection,
    		title,
    		row,
    		col,
    		angle
    	});

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("row" in $$props) $$invalidate(1, row = $$props.row);
    		if ("col" in $$props) $$invalidate(2, col = $$props.col);
    		if ("angle" in $$props) $$invalidate(3, angle = $$props.angle);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, row, col, angle];
    }

    class Rover extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { title: 0, row: 1, col: 2, angle: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Rover",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*title*/ ctx[0] === undefined && !("title" in props)) {
    			console.warn("<Rover> was created without expected prop 'title'");
    		}

    		if (/*row*/ ctx[1] === undefined && !("row" in props)) {
    			console.warn("<Rover> was created without expected prop 'row'");
    		}

    		if (/*col*/ ctx[2] === undefined && !("col" in props)) {
    			console.warn("<Rover> was created without expected prop 'col'");
    		}

    		if (/*angle*/ ctx[3] === undefined && !("angle" in props)) {
    			console.warn("<Rover> was created without expected prop 'angle'");
    		}
    	}

    	get title() {
    		throw new Error("<Rover>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Rover>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get row() {
    		throw new Error("<Rover>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set row(value) {
    		throw new Error("<Rover>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get col() {
    		throw new Error("<Rover>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set col(value) {
    		throw new Error("<Rover>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get angle() {
    		throw new Error("<Rover>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set angle(value) {
    		throw new Error("<Rover>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const gridDimensions = writable({
        width: 16,
        height: 9,
    });
    const rovers = writable([]);

    const tileDecider = (x, y, gridWidth, gridHeight) => {
        let tile = Tiles.center;
        if (x === gridWidth - 1 && y === 0) {
            tile = Tiles.topRight;
        }
        else if (x === 0 && y === 0) {
            tile = Tiles.topLeft;
        }
        else if (y === gridHeight - 1 && x === 0) {
            tile = Tiles.bottomLeft;
        }
        else if (y === gridHeight - 1 && x === gridWidth - 1) {
            tile = Tiles.bottomRight;
        }
        else if (y === 0) {
            tile = Tiles.topCenter;
        }
        else if (x === 0) {
            tile = Tiles.left;
        }
        else if (x === gridWidth - 1) {
            tile = Tiles.right;
        }
        else if (y === gridHeight - 1) {
            tile = Tiles.bottomCenter;
        }
        return { url: tile };
    };
    const genGrid = (gridWidth, gridHeight, rovers) => {
        let tmpGrid = [];
        for (let y = 0; y < gridHeight; y++) {
            tmpGrid[y] = [];
            for (let x = 0; x < gridWidth; x++) {
                tmpGrid[y][x] = tileDecider(x, y, gridWidth, gridHeight);
                if (rovers.length > 0) {
                    const roverAtPosition = rovers.find((r) => r.x === x && r.y === y);
                    if (roverAtPosition) {
                        tmpGrid[y][x].rover = Object.assign({}, roverAtPosition);
                    }
                }
            }
        }
        return tmpGrid;
    };

    /* src/components/Grid.svelte generated by Svelte v3.31.0 */
    const file$1 = "src/components/Grid.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	child_ctx[5] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[8] = i;
    	return child_ctx;
    }

    // (16:12) {#if Item.rover}
    function create_if_block(ctx) {
    	let rover;
    	let current;

    	rover = new Rover({
    			props: {
    				title: /*Item*/ ctx[6].rover.name,
    				angle: /*Item*/ ctx[6].rover.angle,
    				row: /*row*/ ctx[8],
    				col: /*col*/ ctx[5]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(rover.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(rover, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const rover_changes = {};
    			if (dirty & /*grid*/ 1) rover_changes.title = /*Item*/ ctx[6].rover.name;
    			if (dirty & /*grid*/ 1) rover_changes.angle = /*Item*/ ctx[6].rover.angle;
    			rover.$set(rover_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(rover.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(rover.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(rover, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(16:12) {#if Item.rover}",
    		ctx
    	});

    	return block;
    }

    // (12:6) {#each grid[col] as Item, row}
    function create_each_block_1(ctx) {
    	let div1;
    	let div0;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t;
    	let current;
    	let if_block = /*Item*/ ctx[6].rover && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t = space();
    			if (if_block) if_block.c();
    			if (img.src !== (img_src_value = /*Item*/ ctx[6].url)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = `tile-${/*row*/ ctx[8]}-${/*col*/ ctx[5]}`);
    			add_location(img, file$1, 14, 12, 450);
    			attr_dev(div0, "class", "relative");
    			add_location(div0, file$1, 13, 10, 415);
    			attr_dev(div1, "class", "float-left whitespace-no-wrap");
    			add_location(div1, file$1, 12, 8, 361);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div0, t);
    			if (if_block) if_block.m(div0, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*grid*/ 1 && img.src !== (img_src_value = /*Item*/ ctx[6].url)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (/*Item*/ ctx[6].rover) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*grid*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div0, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(12:6) {#each grid[col] as Item, row}",
    		ctx
    	});

    	return block;
    }

    // (10:2) {#each grid as _, col}
    function create_each_block(ctx) {
    	let div;
    	let t;
    	let current;
    	let each_value_1 = /*grid*/ ctx[0][/*col*/ ctx[5]];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(div, "class", "clear-both");
    			add_location(div, file$1, 10, 4, 291);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*grid*/ 1) {
    				each_value_1 = /*grid*/ ctx[0][/*col*/ ctx[5]];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, t);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(10:2) {#each grid as _, col}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let current;
    	let each_value = /*grid*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "p-4 w-max");
    			add_location(div, file$1, 8, 0, 238);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*grid*/ 1) {
    				each_value = /*grid*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $gridDimensions;
    	let $rovers;
    	validate_store(gridDimensions, "gridDimensions");
    	component_subscribe($$self, gridDimensions, $$value => $$invalidate(1, $gridDimensions = $$value));
    	validate_store(rovers, "rovers");
    	component_subscribe($$self, rovers, $$value => $$invalidate(2, $rovers = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Grid", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Grid> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Rover,
    		gridDimensions,
    		rovers,
    		genGrid,
    		grid,
    		$gridDimensions,
    		$rovers
    	});

    	$$self.$inject_state = $$props => {
    		if ("grid" in $$props) $$invalidate(0, grid = $$props.grid);
    	};

    	let grid;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$gridDimensions, $rovers*/ 6) {
    			 $$invalidate(0, grid = genGrid($gridDimensions.width, $gridDimensions.height, $rovers));
    		}
    	};

    	return [grid, $gridDimensions, $rovers];
    }

    class Grid extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Grid",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    const rotateRover = (command, currentAngle) => {
        if (command === 'l') {
            if (currentAngle <= -90) {
                return 180;
            }
            return currentAngle - 90;
        }
        else if (command === 'r') {
            if (currentAngle > 90) {
                return -90;
            }
            return currentAngle + 90;
        }
    };
    const moveRoverOneStep = (currentDir, gridWidth, gridHeight, roverX, roverY) => {
        const directionMap = {
            n: { newX: roverX, newY: roverY - 1 },
            e: { newX: roverX + 1, newY: roverY },
            s: { newX: roverX, newY: roverY + 1 },
            w: { newX: roverX - 1, newY: roverY },
        };
        // based on our angle, move the rover accordingly
        const { newX, newY } = directionMap[currentDir];
        if (newX > gridWidth - 1 || newX < 0 || newY > gridHeight - 1 || newY < 0) {
            console.log('cannot move any more in this direction ', roverX, roverY);
            // set it to what it already is
            return { newX: roverX, newY: roverY };
        }
        return Object.assign({}, directionMap[currentDir]);
    };

    const COMMAND_PHASES = [
        {
            text: 'Enter one of: plateau:, {rover} land:, {rover} instruct:',
        },
        {
            qualifier: 'plateau:',
            regexTest: /^\d+(?:\s+\d+)$/,
            text: 'Enter the size of the plateau as: X Y ',
            commitFn: ([x, y]) => {
                gridDimensions.update(() => ({
                    width: parseInt(x, 10),
                    height: parseInt(y, 10),
                }));
            },
            errorMsg: 'Invalid, try something like: plateau: 7 7',
        },
        {
            qualifier: 'land:',
            // only a string, followed by x y, and then cardinal dir are allowed
            regexTest: /^\w+(?:\s+\d+){2}\s[nesw]$/,
            text: 'Where the rover will land as: X Y Direction(nesw)',
            commitFn: ([name, x, y, dir]) => {
                const { width, height } = get_store_value(gridDimensions);
                const intX = parseInt(x, 10);
                const intY = parseInt(y, 10);
                if (intX > width - 1 || intX < 0 || intY < 0 || intY > height - 1) {
                    throw new Error(`Please enter values below: ${width} ${height} `);
                }
                // update global rovers object with an object holding the rovers position
                rovers.update((r) => [
                    ...r,
                    {
                        name,
                        x: intX,
                        y: intY,
                        angle: getRoverAngle(dir),
                    },
                ]);
            },
            errorMsg: 'Invalid, try something like: bobTheRover land: 2 2 n',
        },
        {
            qualifier: 'instruct:',
            regexTest: /^\w+\s+[lrm]+$/,
            text: 'Where to move the rover, one of only: l r m',
            commitFn: ([name, commandSequence]) => {
                //split commands into array
                const commandsArray = commandSequence.split('');
                // find the name in our rover data struct and update it
                rovers.update((allRovers) => {
                    let foundRover = false;
                    const newRovers = allRovers.map((rover) => {
                        const tmpRover = Object.assign({}, rover);
                        if (tmpRover.name === name) {
                            foundRover = true;
                            //   bingo, we found a match, and the command will propagate to all rovers of same name
                            commandsArray.reduce((acc, currCommand) => {
                                if (currCommand === 'l' || currCommand === 'r') {
                                    acc.angle = rotateRover(currCommand, acc.angle);
                                }
                                else if (currCommand === 'm') {
                                    const { width, height } = get_store_value(gridDimensions);
                                    const { newX, newY } = moveRoverOneStep(getRoverDirection(acc.angle), width, height, acc.x, acc.y);
                                    acc.x = newX;
                                    acc.y = newY;
                                }
                                return acc;
                            }, tmpRover);
                        }
                        return tmpRover;
                    });
                    if (!foundRover) {
                        throw new Error(`No rover by the name of "${name}"`);
                    }
                    return newRovers;
                });
            },
            errorMsg: 'Invalid, try something like: instruct: mrml',
        },
    ];

    /* src/components/GridCommand.svelte generated by Svelte v3.31.0 */

    const { console: console_1 } = globals;
    const file$2 = "src/components/GridCommand.svelte";

    function create_fragment$2(ctx) {
    	let form;
    	let div3;
    	let div2;
    	let div1;
    	let p0;
    	let t0_value = /*currentPhase*/ ctx[3].text + "";
    	let t0;
    	let t1;
    	let div0;
    	let p1;
    	let t3;
    	let input;
    	let t4;
    	let p2;
    	let t5;
    	let t6;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			form = element("form");
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			div0 = element("div");
    			p1 = element("p");
    			p1.textContent = ">";
    			t3 = space();
    			input = element("input");
    			t4 = space();
    			p2 = element("p");
    			t5 = text(/*errorMsg*/ ctx[0]);
    			t6 = space();
    			button = element("button");
    			button.textContent = "Send";
    			attr_dev(p0, "class", "flex py-3 self-center");
    			add_location(p0, file$2, 65, 8, 2036);
    			attr_dev(p1, "class", "font-bold pr-2");
    			add_location(p1, file$2, 68, 10, 2140);
    			attr_dev(input, "aria-label", "enter a command");
    			attr_dev(input, "class", "flex font-bold bg-gray-800 text-white w-full");
    			add_location(input, file$2, 69, 10, 2185);
    			attr_dev(div0, "class", "flex flex-row");
    			add_location(div0, file$2, 67, 8, 2102);
    			attr_dev(p2, "class", "text-red-500 h-4 ml-4 mt-1");
    			add_location(p2, file$2, 77, 8, 2442);
    			attr_dev(div1, "class", "flex flex-col w-full");
    			add_location(div1, file$2, 64, 6, 1993);
    			attr_dev(div2, "class", "py-8 px-8 ml-4 bg-gray-800 rounded-xl shadow-md space-y-2 sm:py-4 sm:space-y-0 sm:space-x-6 text-white fond-bold font-inter");
    			add_location(div2, file$2, 61, 4, 1838);
    			attr_dev(button, "class", "bg-red-500 ml-3 hover:bg-red-400 text-white font-bold py-2 px-4 border-b-4 border-red-700 hover:border-red-500 rounded");
    			add_location(button, file$2, 80, 4, 2523);
    			attr_dev(div3, "class", "flex flex-row");
    			add_location(div3, file$2, 60, 2, 1806);
    			add_location(form, file$2, 59, 0, 1755);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, p0);
    			append_dev(p0, t0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, p1);
    			append_dev(div0, t3);
    			append_dev(div0, input);
    			/*input_binding*/ ctx[6](input);
    			set_input_value(input, /*commands*/ ctx[2]);
    			append_dev(div1, t4);
    			append_dev(div1, p2);
    			append_dev(p2, t5);
    			append_dev(div3, t6);
    			append_dev(div3, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*handleInput*/ ctx[4], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[7]),
    					listen_dev(form, "submit", prevent_default(/*handleSubmit*/ ctx[5]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*currentPhase*/ 8 && t0_value !== (t0_value = /*currentPhase*/ ctx[3].text + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*commands*/ 4 && input.value !== /*commands*/ ctx[2]) {
    				set_input_value(input, /*commands*/ ctx[2]);
    			}

    			if (dirty & /*errorMsg*/ 1) set_data_dev(t5, /*errorMsg*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			/*input_binding*/ ctx[6](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("GridCommand", slots, []);
    	
    	let errorMsg = "";
    	let inputRef;

    	onMount(() => {
    		inputRef.focus();
    	});

    	// user inputted
    	let commands = "";

    	let currentPhase = COMMAND_PHASES[0];

    	const findMatchedPhase = coms => {
    		return COMMAND_PHASES.filter(e => coms && coms.includes(e.qualifier)) || [];
    	};

    	const handleInput = () => {
    		const [matchedPhase] = findMatchedPhase(commands.toLowerCase());

    		if (matchedPhase) {
    			// set current phase
    			$$invalidate(3, currentPhase = matchedPhase);
    		} else {
    			// reset it to the default phase
    			$$invalidate(3, currentPhase = COMMAND_PHASES[0]);
    		}
    	};

    	const handleSubmit = () => {
    		$$invalidate(0, errorMsg = "");

    		// if we have a matching qualifier, set our command phase to that (we only care about the last one)
    		// only full matches are considered
    		const upperCaseCommands = commands.toLowerCase();

    		const [matchedPhase] = findMatchedPhase(upperCaseCommands);

    		if (matchedPhase) {
    			const coords = upperCaseCommands.replace(matchedPhase.qualifier, "").trim();

    			if (coords.match(matchedPhase.regexTest)) {
    				try {
    					matchedPhase.commitFn(coords.split(/[ ,]+/));

    					// on successful match, reset state
    					$$invalidate(2, commands = "");

    					$$invalidate(3, currentPhase = COMMAND_PHASES[0]);
    				} catch(e) {
    					// something internal to the function went wrong
    					console.error(e);

    					$$invalidate(0, errorMsg = e);
    				}
    			} else {
    				// set error message
    				$$invalidate(0, errorMsg = matchedPhase.errorMsg);
    			}
    		} else {
    			$$invalidate(0, errorMsg = "Invalid input");
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<GridCommand> was created with unknown prop '${key}'`);
    	});

    	function input_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			inputRef = $$value;
    			$$invalidate(1, inputRef);
    		});
    	}

    	function input_input_handler() {
    		commands = this.value;
    		$$invalidate(2, commands);
    	}

    	$$self.$capture_state = () => ({
    		COMMAND_PHASES,
    		onMount,
    		errorMsg,
    		inputRef,
    		commands,
    		currentPhase,
    		findMatchedPhase,
    		handleInput,
    		handleSubmit
    	});

    	$$self.$inject_state = $$props => {
    		if ("errorMsg" in $$props) $$invalidate(0, errorMsg = $$props.errorMsg);
    		if ("inputRef" in $$props) $$invalidate(1, inputRef = $$props.inputRef);
    		if ("commands" in $$props) $$invalidate(2, commands = $$props.commands);
    		if ("currentPhase" in $$props) $$invalidate(3, currentPhase = $$props.currentPhase);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		errorMsg,
    		inputRef,
    		commands,
    		currentPhase,
    		handleInput,
    		handleSubmit,
    		input_binding,
    		input_input_handler
    	];
    }

    class GridCommand extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GridCommand",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    function styleInject(css, ref) {
      if ( ref === void 0 ) ref = {};
      var insertAt = ref.insertAt;

      if (!css || typeof document === 'undefined') { return; }

      var head = document.head || document.getElementsByTagName('head')[0];
      var style = document.createElement('style');
      style.type = 'text/css';

      if (insertAt === 'top') {
        if (head.firstChild) {
          head.insertBefore(style, head.firstChild);
        } else {
          head.appendChild(style);
        }
      } else {
        head.appendChild(style);
      }

      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
    }

    var css_248z = "";
    styleInject(css_248z);

    /* src/App.svelte generated by Svelte v3.31.0 */
    const file$3 = "src/App.svelte";

    function create_fragment$3(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let h1;
    	let t1;
    	let gridcommand;
    	let t2;
    	let grid;
    	let current;
    	gridcommand = new GridCommand({ $$inline: true });
    	grid = new Grid({ $$inline: true });

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Mars Rover Controls";
    			t1 = space();
    			create_component(gridcommand.$$.fragment);
    			t2 = space();
    			create_component(grid.$$.fragment);
    			attr_dev(h1, "class", "text-4xl");
    			add_location(h1, file$3, 172829, 6, 3975996);
    			attr_dev(div0, "class", "text-center");
    			add_location(div0, file$3, 172828, 4, 3975964);
    			attr_dev(div1, "class", "font-inter");
    			add_location(div1, file$3, 172827, 2, 3975935);
    			add_location(div2, file$3, 172826, 0, 3975927);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, h1);
    			append_dev(div2, t1);
    			mount_component(gridcommand, div2, null);
    			append_dev(div2, t2);
    			mount_component(grid, div2, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(gridcommand.$$.fragment, local);
    			transition_in(grid.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(gridcommand.$$.fragment, local);
    			transition_out(grid.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(gridcommand);
    			destroy_component(grid);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Grid, GridCommand });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
