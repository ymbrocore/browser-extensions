'use strict';

const TestType = {
    REQUIRE: 0,
    SUGGEST: 1
};

const TestSetResult = {
    PASS: 0,
    PARTIALLY: 1,
    FAIL: 2,
    SKIP: 3
};

const default_params = {
    async: false,
    hideOnSuccess: false
};

const SINGLE_TEST_TIME_LIMIT = 3000; // ms

class Test {
    constructor(fn, type, params) {
        this.params = JSON.parse(JSON.stringify(default_params));
        if (params !== undefined) {
            for (let key in params) {
                if (params.hasOwnProperty(key)) {
                    this.params[key] = params[key];
                }
            }
        }

        this.fn = () => Promise.resolve().then(fn).then(msg => {
            if (!this.params.async && msg !== '' && !(msg && msg.skip)) throw new Error(String(msg));
            return msg === undefined ? '' : msg;
        });

        this.type = type;
    }

    run() {
        if (this.params.skip) {
            return Promise.resolve({ status: TestSetResult.SKIP, msg: this.params.skip });
        }
        let self = this;
        return new Promise(resolve => {
            let resolved = false, tl_exceeded = false;
            let timer;

            try {
                this.fn().then(msg => {
                        if (tl_exceeded) return;
                        resolved = true;
                        clearTimeout(timer);

                        resolve({
                            status: msg && msg.skip ? TestSetResult.SKIP : TestSetResult.PASS,
                            msg: msg && msg.skip ? msg.skip : msg,
                            hideOnSuccess: self.params.hideOnSuccess
                        });
                    }, msg => {
                        if (tl_exceeded) return;
                        resolved = true;
                        clearTimeout(timer);

                        if (this.type == TestType.SUGGEST) {
                            resolve({
                                status: TestSetResult.PARTIALLY,
                                msg: String(msg),
                                hideOnSuccess: self.params.hideOnSuccess
                            });
                        } else {
                            resolve({
                                status: TestSetResult.FAIL,
                                msg: String(msg),
                                hideOnSuccess: self.params.hideOnSuccess
                            });
                        }
                    }
                );
            } catch (e) {
                resolve({
                    status: TestSetResult.FAIL,
                    msg: "Exception occurred during test running: " + e,
                    hideOnSuccess: false
                })
            }

            const timeLimit = self.params.timeout || SINGLE_TEST_TIME_LIMIT;
            timer = setTimeout(() => {
                if (!resolved) {
                    tl_exceeded = true;
                    resolve({
                        status: TestSetResult.FAIL,
                        msg: `Time limit for test exceeded: ${timeLimit}ms`
                    });
                }
            }, timeLimit);
        });
    }
}

class TestSet {
    constructor() {
        this.tests = [];
        this.manual_tests = [];
        this.fns = [];
    }

    suggest(name, fn, params) {
        this.tests[name] = new Test(fn, TestType.SUGGEST, params);
        return this;
    }

    require(name, fn, params) {
        this.tests[name] = new Test(fn, TestType.REQUIRE, params);
        return this;
    }

    skip(name, reason) {
        this.tests[name] = new Test(() => '', TestType.REQUIRE, { skip: reason });
        return this;
    }

    manual(id, html) {
        this.manual_tests[id] = html;
        return this;
    }

    report_ready(fn) {
        this.fns.push(fn);
        return this;
    }

    runAll() {
        let tests = this.tests;
        return {
            auto_tests: [...function* () {
                for (let key in tests) {
                    if (tests.hasOwnProperty(key)){
                        yield key;
                    }
                }
            }()].reduce((prev, curr) => {
                return prev.then(results => new Promise(resolve => {
                    tests[curr].run().then(res => {
                        resolve(results.concat([{
                            name: curr,
                            result: res
                        }]));
                    });
                }))
            }, Promise.resolve([{}])),
            manual_tests: this.manual_tests
        }
    }
}

class APITest {
    constructor() {
        this.sets = [];
        this.res = undefined;
        this.fns = [];
    }

    addTestSet(name, test_set) {
        this.sets[name] = test_set;
        return this;
    }

    runAll() {
        let sets = this.sets;
        let idx = 1, len = Object.keys(sets).length;

        this.res = [...function* () {
            for (let key in sets) {
                if (sets.hasOwnProperty(key)) {
                    yield key
                }
            }
        }()].reduce((prev, curr) => {
            return prev.then(results => new Promise(resolve => {
                this.fns = this.fns.concat(sets[curr].fns);
                let tmp = sets[curr].runAll();
                tmp.auto_tests.then(res => {
                    if (idx == len) {
                        $('#status').detach();
                    } else {
                        $('#status').text(`Running... ${idx}/${len}`);
                        idx++;
                    }

                    resolve(results.concat([{
                        title: curr,
                        auto_tests: res.slice(1),
                        manual_tests: tmp.manual_tests
                    }]));
                });
            }))
        }, Promise.resolve([{}]));

        return this.res;
    }

    htmlReport() {
        let bg_color = ["#dff0d8", "#fcf8e3", "#f2dede", "#eeeeee"];
        let text_color = ["#3c763d", "#8a6d3b", "#a94442", "#555555"];
        let title_color = ["#5cb85c", "#f0ad4e", "#d9534f", "#777777"];
        let test_results = ["[Success]", "[Partially]", "[Failed]", "[Skipped]"];
        const div = '<div></div>';

        if (this.res) {
            return new Promise(resolve => {
                this.res.then(res => {
                    let $html = $(div).addClass('report-container').append([...function* () {
                        for (let test_set of res.slice(1)) {
                            yield $(div).addClass('test-set-container').append([...function* () {
                                let test_set_status = [...function* () {
                                    for (let i of test_set.auto_tests) {
                                        yield i.result.status;
                                    }
                                }()].filter(status => status !== TestSetResult.SKIP);
                                test_set_status = test_set_status.length
                                    ? Math.max(...test_set_status) : TestSetResult.SKIP;

                                yield $(div)
                                    .addClass('auto-test-set-title')
                                    .css('background-color', title_color[test_set_status])
                                    .text(`${test_set.title}: ${test_results[test_set_status]}`);

                                let $tests_list = $(div).addClass('auto-tests-list');
                                if (test_set_status == TestSetResult.PASS) {
                                    $tests_list.hide();
                                }

                                yield $tests_list.append([...function* () {
                                    for (let test of test_set.auto_tests) {
                                        let status = test.result.status === TestSetResult.SKIP ? "Skip"
                                            : test.result.status === TestSetResult.PASS ? "OK" : "Fail";
                                        let msg = test.result.msg === '' ? '' : '[' + test.result.msg + ']';

                                        if (test.result.status != TestSetResult.PASS || !test.result.hideOnSuccess) {
                                            yield $(div)
                                                .addClass('auto-test-item')
                                                .css({
                                                    'background-color': bg_color[test.result.status],
                                                    'color': text_color[test.result.status],
                                                })
                                                .text(`${test.name}: ${status} ${msg}`);

                                            yield $(div).addClass('line');
                                        }
                                    }
                                }()]);

                                if (Object.keys(test_set.manual_tests).length) {
                                    yield $(div)
                                        .addClass('manual-test-set-title')
                                        .text("Manual Checklist");

                                    yield $(div).addClass('manual-tests-list').append([...function* () {
                                        for (let test in test_set.manual_tests) {
                                            if (test_set.manual_tests.hasOwnProperty(test)) {
                                                yield $(div)
                                                    .addClass('manual-test-item')
                                                    .attr('id', test)
                                                    .html(test_set.manual_tests[test] + ": Not done yet");
                                                yield $(div).addClass('line');
                                            }
                                        }
                                    }()]);
                                }
                            }()]);
                        }
                    }()]);

                    resolve($html);
                });
            });
        }
    }
}
