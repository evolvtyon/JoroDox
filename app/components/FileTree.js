import React from 'react';
import classNames from 'classnames';
import InfiniteTree from 'react-infinite-tree';
import 'react-infinite-tree/dist/react-infinite-tree.css';
const jetpack = require('electron').remote.require('fs-jetpack');
import { Route } from 'react-router';

const data = {
    id: 'fruit',
    name: 'Fruit',
    children: [{
        id: 'apple',
        name: 'Apple'
    }, {
        id: 'banana',
        name: 'Banana',
        children: [{
            id: 'cherry',
            name: 'Cherry',
            loadOnDemand: true
        }]
    }]
};

export default class FileTree extends React.Component {
    tree = null;
    treeData = null;

    constructor(props) {
        super(props);

        let rootInfo = jetpack.inspect(this.props.root, {absolutePath: true});

        this.treeData = {
            id: rootInfo.absolutePath,
            name: rootInfo.name,
            loadOnDemand: true,
            info: rootInfo,
        };

        console.log(props)
    }

    componentDidMount() {
        this.tree.loadData(this.treeData);

        // Select the first node
        this.tree.selectNode(this.tree.getChildNodes()[0]);
    }
    render(){
        return (
            <Route render={({ history}) => (<InfiniteTree
                style={{display: 'flex', flex: 1, backgroundColor: 'white'}}
                ref={(c) => this.tree = c ? c.tree : null}
                autoOpen={true}
                loadNodes={(parentNode, done) => {
                    let dirs = jetpack.find(parentNode.id, {matching: '*', recursive: false, files: false, directories: true});
                    let files = jetpack.find(parentNode.id, {matching: '*', recursive: false});

                    let dirNodes = dirs.map((name) => {
                        name = name.substring(parentNode.id.length + 4);
                        return {
                            id: parentNode.id + "/" + name,
                            name: name,
                            loadOnDemand: true,
                            info: {
                                'name': name,
                                type: 'dir',
                                absolutePath: parentNode.id + "/" + name,
                            },
                        };
                    }).sort((a, b) => {
                        return a.name.localeCompare(b.name);
                    });
                    let fileNodes = files.map((name) => {
                        name = name.substring(parentNode.id.length + 4);
                        return {
                            id: parentNode.id + "/" + name,
                            name: name,
                            loadOnDemand: false,
                            info: {
                               'name': name,
                                type: 'file',
                                absolutePath: parentNode.id + "/" + name,
                            },
                        };
                    }).sort((a, b) => {
                        return a.name.localeCompare(b.name);
                    });

                    done(null, dirNodes.concat(fileNodes));
                }}
                rowRenderer={(node, treeOptions) => {
                    const { id, name, loadOnDemand = false, children, state, props = {} } = node;
                    const droppable = treeOptions.droppable;
                    const { depth, open, path, total, selected = false } = state;
                    const more = node.hasChildren();

                    return (
                        <div
                            className={classNames(
                                'infinite-tree-item',
                                { 'infinite-tree-selected': selected }
                            )}
                            data-id={id}
                        >
                            <div
                                className="infinite-tree-node"
                                style={{ marginLeft: depth * 18 }}
                            >
                                {!more && loadOnDemand &&
                                <a className={classNames(treeOptions.togglerClass, 'infinite-tree-closed')}>❯</a>
                                }
                                {more && open &&
                                <a className={classNames(treeOptions.togglerClass)}>❯</a>
                                }
                                {more && !open &&
                                <a className={classNames(treeOptions.togglerClass, 'infinite-tree-closed')}>❯</a>
                                }
                                {!more && !loadOnDemand &&
                                <span className={classNames(treeOptions.togglerClass)}> </span>
                                }
                                <span className={classNames(["infinite-tree-type", more || loadOnDemand ? 'infinite-tree-type-more' : ''])}>{more || loadOnDemand ? '🖿' : '🗎'}</span>
                                <span className="infinite-tree-title">{name}</span>
                            </div>
                        </div>
                    );
                }}
                selectable={true}
                shouldSelectNode={(node) => {
                    if (!node || (node === this.tree.getSelectedNode())) {
                        if (node && node.info.type == 'dir') {
                            this.tree.toggleNode(node);
                        }
                        return false; // Prevent from deselecting the current node
                    }
                    return true;
                }}
                onClick={(event) => {
                    // click event
                    const target = event.target || event.srcElement; // IE8
                    //history.push('/fileview/')

                }}
                onDoubleClick={(event) => {
                    // dblclick event
                }}
                onKeyDown={(event) => {
                    // keydown event
                }}
                onKeyUp={(event) => {
                    // keyup event
                }}
                onOpenNode={(node) => {
                }}
                onCloseNode={(node) => {
                }}
                onSelectNode={(node) => {
                    if (node.info.type == 'dir') {
                        this.tree.openNode(node);
                    }
                    history.push('/fileview/'+ node.info.absolutePath);
                }}
                onClusterWillChange={() => {
                }}
                onClusterDidChange={() => {
                }}
                onContentWillUpdate={() => {
                }}
                onContentDidUpdate={() => {
                }}
            />)} />
        );
    }
}
