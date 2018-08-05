// @flow
import React, {Component} from 'react';
import InfiniteTree from 'react-infinite-tree';
import {List, AutoSizer, Column} from 'react-virtualized';
import * as iconv from 'iconv-lite';
import classNames from 'classnames';
import Icon from '@material-ui/core/Icon';

import ItemGrid from './ItemGrid';

import {inject, observer} from 'mobx-react';
import {autorun, observable, reaction} from 'mobx';
import PdxScript from '../utils/PdxScript';

const jetpack = require('electron').remote.require('fs-jetpack');

@observer
export default class StructureDataTree extends Component {

  @observable.shallow treeData = [];

  constructor(props) {
    super(props);

    this.state = {
      fileTreeData: this.props.data
    };
  }

  componentDidMount() {
    autorun(() => {
      this.loadData(this.props.data);
    });


    if (this.props.expandToDepth) {
      reaction(
        () => this.props.data,
        () => this.expandNodeChildren(this.treeData, this.props.expandToDepth)
      );
    }
  }

  expandNodeChildren(nodeChildren, depth) {
    if (!nodeChildren) {
      return;
    }

    nodeChildren.forEach(x => {
      if (x.depth > depth) {
        return;
      }
      this.toggleRowById(x.id);
      if (x.children.length > 0) {
        this.expandNodeChildren(x.children, depth);
      }
    });
  }

  loadData() {
    const rootNode = this.createTreeNode('data', this.props.data);
    this.treeData = rootNode.children;
  }

  toggleRowById(id) {
    const index = this.treeData.findIndex(x => x.id === id);
    if (index) {
      this.toggleRow({index, rowData: this.treeData[index]});
    }
  }

  toggleRow({index, rowData}, noToggle) {
    if (!noToggle) {
      rowData.expanded = !rowData.expanded;
    }

    let change = 0;

    if (rowData.expanded) {
      this.treeData.splice(index + 1, 0, ...rowData.children);

      rowData.children.forEach((child, key) => {
        if (child.expanded) {
          change += this.toggleRow({index: index + key + change + 1, rowData: child}, true);
        }
      });

      change += rowData.children.length;

    } else {
      change = -this.getExpandedCount(rowData);
      this.treeData.splice(index + 1, -change);
    }

    return change;
  }

  getExpandedCount(node) {
    const subSum = _.sumBy(node.children, (x) => x.expanded ? this.getExpandedCount(x) : 0);
    return node.children.length + subSum;
  }


  createTreeNode(key, value, path, depth) {
    if (!depth) {
      depth = 0;
    }

    const node = {
      id: path + '.' + key,
      depth,
      name: key,
      children: [],
    };

    if (_.isArray(value) && value.length > 100 && value.slice(100).every(x => !_.isObject(x))) {
      node.value = value;
    } else if (_.isArray(value)) {
      node.children = value.map((x, index) => this.createTreeNode(index, x, path + '.' + key, depth + 1));
    } else if (_.isObject(value)) {
      node.children = _.entries(value).map(([k, v]) => this.createTreeNode(k, v, path + '.' + key, depth + 1));
    } else {
      node.value = value;
    }

    return node;
  }

  render() {
    return (
      <ItemGrid list={this.treeData} style={{minHeight: 200}} disableHeight maxHeight={this.props.maxHeight} onRowClick={this.toggleRow.bind(this)}>
        <Column
          width={30}
          dataKey="name"
          label="Name"
          cellRenderer={({rowData}) => (
            <span style={{marginLeft: (rowData.depth) * 20, position: 'relative'}} on>
              <a style={{position: 'absolute', display: 'block', left: -20, top: -2, width: 18, height: 22, textAlign: 'center', fontSize: 14, transform: rowData.expanded ? 'rotate(90deg)' : ''}}>{rowData.children.length ? '❯' : ''}</a>
              {rowData.name}
            </span>
          )}
        />
        <Column
          width={100}
          dataKey="value"
          label="Data"
          style={{color: 'green'}}
          cellRenderer={({rowData}) => {
            if (rowData.children.length) {
              if (rowData.expanded) {
                return '';
              }
              return <em style={{color: 'lightgrey'}}>{rowData.children.length} items</em>;
            }
            if (_.isArray(rowData.value)) {
              return rowData.value.length + ' items: [' + rowData.value.slice(0, 20).join(', ') + (rowData.value.length > 20 ? '... '+ (rowData.value.length - 20) + ' more items' : '') + ']';
            }
            return rowData.value;
          }}
        />
      </ItemGrid>
    );
  }
}
