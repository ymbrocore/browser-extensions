'use strict';

var bookmarks_test = new TestSet()
    .require("[Method Exists] bookmarks", methodExists(chrome, 'bookmarks'), { hideOnSuccess: true })

    .require("[Method Exists] get", methodExists(chrome.bookmarks, 'get'), { hideOnSuccess: true })
    .require('[Invalid bookmark id rejected] get', expectMethodError(chrome.bookmarks, 'get', /invalid|find.*bookmark/i, "", () => {}))

    .require("[Method Exists] getChildren", methodExists(chrome.bookmarks, 'getChildren'), { hideOnSuccess: true })
    .require('[Invalid bookmark id rejected] getChildren', expectMethodError(chrome.bookmarks, 'getChildren', /invalid|find.*bookmark/i, "", () => {}))

    .require("[Method Exists] getRecent", methodExists(chrome.bookmarks, 'getRecent'), { hideOnSuccess: true })
    .require("[Metohd Call] getRecent", methodCall(chrome.bookmarks, 'getRecent', 1, () => {}))

    .require("[Method Exists] getTree", methodExists(chrome.bookmarks, 'getTree'), { hideOnSuccess: true })
    .require("[Method Call] getTree", methodCall(chrome.bookmarks, 'getTree', () => {}))

    .require("[Method Exists] getSubTree", methodExists(chrome.bookmarks, 'getSubTree'), { hideOnSuccess: true })
    .require('[Invalid bookmark id rejected] getSubTree', expectMethodError(chrome.bookmarks, 'getSubTree', /invalid|find.*bookmark/i, "", () => {}))

    .require("[Method Exists] search", methodExists(chrome.bookmarks, 'search'), { hideOnSuccess: true })
    .require("[Method Call] search", methodCall(chrome.bookmarks, 'search', "", () => {}))

    .require("[Method Exists] create", methodExists(chrome.bookmarks, 'create'), { hideOnSuccess: true })
    .require("[Method Call] create", methodCall(chrome.bookmarks, 'create', {},
        bookmark => chrome.bookmarks.remove(bookmark.id)))

    .require("[Method Exists] move", methodExists(chrome.bookmarks, 'move'), { hideOnSuccess: true })
    .require('[Invalid bookmark id rejected] move', expectMethodError(chrome.bookmarks, 'move', /invalid|find.*bookmark/i, "", {}, () => {}))

    .require("[Method Exists] update", methodExists(chrome.bookmarks, 'update'), { hideOnSuccess: true })
    .require('[Invalid bookmark id rejected] update', expectMethodError(chrome.bookmarks, 'update', /invalid|find.*bookmark/i, "", {}, () => {}))

    .require("[Method Exists] remove", methodExists(chrome.bookmarks, 'remove'), { hideOnSuccess: true })
    .require('[Invalid bookmark id rejected] remove', expectMethodError(chrome.bookmarks, 'remove', /invalid|find.*bookmark/i, "", () => {}))

    .require("[Method Exists] removeTree", methodExists(chrome.bookmarks, 'removeTree'), { hideOnSuccess: true })
    .require('[Invalid bookmark id rejected] removeTree', expectMethodError(chrome.bookmarks, 'removeTree', /invalid|find.*bookmark/i, "", () => {}))

    .require("[Create-Search-Remove]", () => {
        return new Promise((resolve, reject) => {
            new Promise(resolve_1 => {
                chrome.bookmarks.search("bookmarks_test_", resolve_1);
            }).then(before => {
                return Promise.all([...function* () {
                    for (let i = 0; i != 7; ++i) {
                        yield new Promise(resolve_2 => {
                            chrome.bookmarks.create({
                                title: "bookmarks_test_" + String(i),
                                url: "http://test"
                            }, resolve_2);
                        });
                    }
                }()]).then(arr => new Promise(resolve_2 => {
                    resolve_2(before.concat(arr));
                }));
            }).then(bookmarks => {
                chrome.bookmarks.search("bookmarks_test_", arr => {
                    if (arr.length != bookmarks.length) {
                        reject(`The number of found bookmarks (${arr.length}) is
                                different from expected (${bookmarks.length})`);
                        return;
                    }

                    Promise.all([...function* () {
                        for (let bookmark of arr) {
                            yield new Promise(resolve_1 => {
                                chrome.bookmarks.remove(bookmark.id, resolve_1);
                            });
                        }
                    }()]).then(() => {
                        Promise.all([...function* () {
                            for (let bookmark of bookmarks) {
                                yield new Promise((resolve_1, reject_1) => {
                                    chrome.bookmarks.get(bookmark.id, bookmark => {
                                        if (typeof bookmark !== 'undefined') {
                                            reject_1("Bookmark still can be found after remove");
                                        } else {
                                            resolve_1();
                                        }
                                    })
                                });
                            }
                        }()]).then(() => {
                            resolve('')
                        }, reject);
                    });
                })
            });
        });
    }, { async: true });
