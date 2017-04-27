import React, { Component } from "react";

//ActivityIndicator is for loading
//AsyncStorage is like local storage to store items
//Keyboard is to hide the keyboard when scrolling
//Platform is to give padding top 30 to iphones
//ListView is to show data from a data source (kind of like paginated ajax query that is triggered on scroll)
//View is like a div
//Text is like a paragraph tag
import { View, Text, ActivityIndicator, StyleSheet, Platform, ListView, Keyboard, AsyncStorage } from "react-native";
import Header from "./app/components/Header";
import Footer from "./app/components/Footer";
import Row from "./app/components/Row";
//var Row = require('./Row')

const filterItems = (filter, items) => {
  console.log(filter);
  return items.filter((item) => {
    if (filter === "ALL") return true;
    if (filter === "COMPLETED") return item.complete;
    if (filter === "ACTIVE") return !item.complete;
  });
}

export default class App extends React.Component {
  constructor(props) {
    super(props);
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    this.state = {
      loading: true,
      allComplete: false,
      filter: "ALL",
      value: "",
      items: [],
      dataSource: ds.cloneWithRows([])
    }
    this.setSource = this.setSource.bind(this);
    this.handleAddItem = this.handleAddItem.bind(this);
    this.handleToggleAllComplete = this.handleToggleAllComplete.bind(this);
    this.handleToggleComplete = this.handleToggleComplete.bind(this);
    this.handleRemoveItem = this.handleRemoveItem.bind(this);
    this.handleFilter = this.handleFilter.bind(this);
    this.handleClearComplete = this.handleClearComplete.bind(this);
    this.handleUpdateText = this.handleUpdateText.bind(this);
    this.handleToggleEditing = this.handleToggleEditing.bind(this);
  }

  //componentWillMount is called before the render method is executed. setting the state in this phase will not trigger a re-rendering.
  //basically we're loading the items from AsyncStorage before we show the items on the screen
  componentWillMount() {
    /*
    //see loading in action (the test data is too little in AsyncStorage to see it)
      //if you don't use => then this inside setTimeout will be the window
      setTimeout(() => {
        this.setState({loading: false})
      }, 2000)
    */

    AsyncStorage.getItem("items").then((itemData) => {
      try {
        const items = JSON.parse(itemData);

        //set loading to false after items get loaded from AsyncStorage
        this.setSource(items, items, { loading: false}); 
      } catch(e) {
        console.log(e)
        this.setState({
          loading: false
        })
      }
    })
  }

  handleUpdateText(key, text) {
    const newItems = this.state.items.map((item) => {
      //console.log('handleUpdateText', item);
      if (item.key !== key) return item;
      return {
        ...item,
        text
      }
    })
    this.setSource(newItems, filterItems(this.state.filter, newItems));
  }

  handleToggleEditing(key, editing) {
    const newItems = this.state.items.map((item) => {
      //console.log('handleToggleEditing', item);

      //item looks like this if it's not the one being edited: {key: 1488949759882, text: "Email Natalie form that Jed gave you", complete: false, editing: false}
      
      // item looks like this if it is the one being edited: {key: 1488949766192, text: "Email Veronica form that Jed gave you! Sup!", complete: false, editing: true}

      if (item.key !== key) return item;
      return {
        ...item,
        editing
      }
    })
    this.setSource(newItems, filterItems(this.state.filter, newItems));
  }

  //drying up the code
  setSource(items, itemsDatasource, otherState = {}) {
    this.setState({
      items,
      dataSource: this.state.dataSource.cloneWithRows(itemsDatasource),
      ...otherState //this means it'll take all of the properties : values in the otherState argument and throw them in here
    })

    AsyncStorage.setItem("items", JSON.stringify(items));
  }

  handleFilter(filter){
    this.setSource(this.state.items, filterItems(filter, this.state.items));
    //------CHECK THE CODE ON GITHUB
    this.state.filter = filter; //had to add this here
    //------CHECK THE CODE ON GITHUB

  }

  handleClearComplete() {
    const newItems = filterItems("ACTIVE", this.state.items);
    this.setSource(newItems, filterItems(this.state.filter, newItems));
  }

  handleRemoveItem(key){
    const newItems = this.state.items.filter((item) => {
      return item.key != key;
    });

    this.setSource(newItems, newItems);
  }

  handleToggleComplete(key, complete){
    const newItems = this.state.items.map((item) => {
      if (item.key != key) return item;

      return {
        ...item,
        complete
      }
    });

    this.setSource(newItems, newItems)
  }

  handleToggleAllComplete() {    
    const complete = !this.state.allComplete;
    const newItems = this.state.items.map((item) => ({
      ...item, //put all of the properties and values of item into this object
      complete //also throw complete in there, es6 will default to doing complete : the value of complete
    }))

    this.setSource(newItems, newItems, { allComplete: complete })
  }

  handleAddItem() {
    if (!this.state.value) return; //don't add items that are blank

    const newItems = [
      ...this.state.items,
      {
        key: Date.now(),
        text: this.state.value,
        complete: false
      }
    ]

    console.log(newItems);

    this.setSource(newItems, newItems, { value: "" })
  }

  render() {
    return (
      <View style={styles.container}>
        <Header 
          value={this.state.value}
          onAddItem={this.handleAddItem}
          onChange={(value) => this.setState({ value })}
          onToggleAllComplete={this.handleToggleAllComplete}
        />

        <View style={styles.content}>
          {/*whenever someone scrolls it will hide the keyboard*/}
          <ListView
            style={styles.list}
            enableEmptySections
            dataSource={this.state.dataSource}
            onScroll={() => Keyboard.dismiss()}
            renderRow={({ key, ...value}) => {
              return (
                <Row
                  key={key}
                  onUpdate={(text) => this.handleUpdateText(key, text)}
                  onToggleEdit={(editing) => this.handleToggleEditing(key, editing)}
                  onRemove={() => this.handleRemoveItem(key)}
                  onComplete={(complete) => this.handleToggleComplete(key, complete)}
                  {...value}
                />
              )
            }}
            renderSeparator={(sectionId, rowId) => {
              return <View key={rowId} style={styles.separator}/>
            }}
          />
        </View>

        <Footer
          count={filterItems("ACTIVE", this.state.items).length}
          onFilter={this.handleFilter}
          filter={this.state.filter}
          onClearComplete={this.handleClearComplete}
        />

        {this.state.loading && <View style={styles.loading}>
          <ActivityIndicator
            animating
            size="large"
          />
        </View>}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    ...Platform.select({
      ios: { paddingTop: 30 }
    })
  },
  loading: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,.2)"
  },
  content: {
    flex: 1
  },
  list: {
    backgroundColor: '#FFF'
  },
  separator: {
    borderWidth: 1,
    borderColor: "#F5F5F5"
  }
})