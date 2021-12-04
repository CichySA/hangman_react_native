import { StatusBar } from 'expo-status-bar'
import React, { Component, Fragment } from 'react';
import { StyleSheet, Text, View, Image } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Provider as PaperProvider, Button} from 'react-native-paper'
import {Slider} from "@miblanchard/react-native-slider"
import { style, width } from 'dom-helpers'
import { LinearGradient } from 'expo-linear-gradient'
import { Line } from 'react-native-svg'
import update from 'immutability-helper'
import Dialog from 'react-native-dialog'

const dictionary_file = require('./assets/words_dictionary.json')

const color = {
  primary: "#3076A3",
  on_primary: "#FFFFFA",
  primary_light: "#7BB0D2",
  on_primary_light: "#373734",
  primary_dark: "#0A4B76",
  secondary: "#FFAB40",
  on_secondary: "#3A3D38",
  secondary_light: "#FFCD8E",
  secondary_dark: "#B86906",
  error: "#B00020",
  on_error: "#D0D0D0"
}

const strings = {
  title: "Hangman",
  startButton: "Start",
  infoTitle: "How to play?",
  sliderLabel: "Word length: ",
  instructions: "Hangman is a game where you guess a word letter by letter. Too many wrong guesses will result in a hanging and game loss.\nTo play, select desired word length and click start. ",
  understood: "Gee, thanks!"
}

const images = [
  require('./assets/drawable/image0of10_transparent.png'),
  require('./assets/drawable/image1of10_transparent.png'),
  require('./assets/drawable/image2of10_transparent.png'),
  require('./assets/drawable/image3of10_transparent.png'),
  require('./assets/drawable/image4of10_transparent.png'),
  require('./assets/drawable/image5of10_transparent.png'),
  require('./assets/drawable/image6of10_transparent.png'),
  require('./assets/drawable/image7of10_transparent.png'),
  require('./assets/drawable/image8of10_transparent.png'),
  require('./assets/drawable/image9of10_transparent.png'),
  require('./assets/drawable/image10of10_transparent.png')
]


// // //
// Keyboard component
// props: {keyboardListener(char), checkCharPresent(char), gameState{mistakeCount, isGameOver}}
// // //
class Keyboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      buttons : {
        Q: 0, W: 0, E: 0, R: 0, T: 0, Y: 0, U: 0, I: 0, O: 0, P: 0,
        A: 0, S: 0, D: 0, F: 0, G: 0, H: 0, J: 0, K: 0, L: 0,
        Z: 0, X: 0, C: 0, V: 0, B: 0, N: 0, M: 0
      }
    }
  }

  componentDidUpdate(prevProps) {
    if(this.props.gameState !== prevProps.gameState) {
      this.lockKeyboard()
    }
  }
  buttonClick(val) {
    this.props.keyboardListener(val)
    let buttonState = this.props.checkCharPresent(val)
    this.setState(update(this.state, {buttons: { [val]: {$set: buttonState}}}))
  }

  buttonStyle(state) {
    switch(state) {
      case 0:
        return styles.keyButton
      case 1:
        return styles.successButton
      case 2:
        return styles.errorButton
    }
  }

  buttonLabelStyle(state) {
    switch(state) {
      case 0:
        return styles.keyButtonLabel
      case 1:
        return styles.successButtonLabel
      case 2:
        return styles.errorButtonLabel
    }
  }

  buttonState(state) {
    return state == 0 ? false : true
  }

  lockKeyboard() {
    let arr = Object.keys(this.state.buttons)
    let newButtonStates = {}
    arr.forEach((key) => {
      newButtonStates[key] = this.props.checkCharPresent(key)
    })
    this.setState(update(this.state, {buttons: {$set: newButtonStates}}))
  }

  //
  //take string as input and make button for every character in that string
  //
  buttonRowFragment(str) {
    let characters = str.toUpperCase().split("")
    let buttonArray = []

    characters.forEach((key) => {
      buttonArray.push(
        <Button mode="contained" 
          disabled={this.buttonState(this.state.buttons[key])} 
          style={this.buttonStyle(this.state.buttons[key])} 
          labelStyle={this.buttonLabelStyle(this.state.buttons[key])} 
          onPress={() => {this.buttonClick(key)}}>
            {key}
        </Button>
      )})

    return(<Fragment>{buttonArray}</Fragment>)
  }

  //
  render() {
    return(
    <View style={{alignItems: 'center', marginBottom: styles.keyButton.margin * 2}}>
      <View style={{flexDirection: 'row', alignContent: 'center'}}>
        {this.buttonRowFragment("QWERTYUIOP")} 
      </View>
      <View style={{flexDirection: 'row', alignContent: 'center'}}>
        {this.buttonRowFragment("ASDFGHJKL")} 
      </View>
      <View style={{flexDirection: 'row', alignContent: 'center'}}>
        {this.buttonRowFragment("ZXCVBNM")} 
      </View>
    </View>);
  }
}

// // //
// Game screen
// props: {navigation}
// // //
class Game extends React.Component {

  #targetWord = ""

  constructor(props) {
    super(props)
    this.#targetWord = this.props.route.params.word.toUpperCase();
    this.keyboardRef = React.createRef()
    this.state={
      word: '*'.repeat(this.#targetWord.length),
      isGameOver: false,
      mistakeCount: 0,
      gameResult: "IN_PROGRESS",
      showDialog: false
    }
    
  }

  checkCharPresent(val) {
    val = val.toUpperCase()
    return this.#targetWord.indexOf(val) == -1 ? 2 : 1
  }
  componentDidUpdate(prevProps, prevState) {
    if(this.state.mistakeCount == 10 && prevState.mistakeCount == 9) {
        this.setState(update(this.state, {word: {$set: this.#targetWord}, isGameOver: {$set: true}, 
          showDialog: {$set: true}, gameResult: {$set: "LOSS"}}))
    }
    else if(this.state.word === this.#targetWord && this.state.word !== prevState.word){
      this.setState(update(this.state, {isGameOver: {$set: true}, showDialog: {$set: true}, 
      gameResult: {$set: "WIN"}}))
    }
  }

  keyboardListener(val) {
    val = val.toUpperCase()
    let tempWord = this.#targetWord
    let ind = tempWord.indexOf(val)
    let lastInd = -1
    if(ind != -1) {
      let newWord = this.state.word
      while(ind != -1) {
        lastInd = lastInd + ind + 1
        newWord = newWord.substr(0, lastInd) + val + newWord.substr(lastInd + val.length)
        tempWord = tempWord.substr(ind+1)
        ind = tempWord.indexOf(val)
        // notify success
      }
      this.setState(update(this.state, { word: {$set: newWord}}))
    }
    else {
      this.setState(update(this.state, {mistakeCount: {$set: this.state.mistakeCount + 1}}))
    }
  }

  getDialogTitle() {
    if(this.state.gameResult == "WIN") return "Victory!"
    else if(this.state.gameResult === "LOSS") return "You lost :("
    else return "Debug me, I shouldn't do that MADGE"

  }
  render() {
    return (
      <LinearGradient
        // Button Linear Gradient
        end={[0,0]}
        start={[1,1]}
        colors={[color.secondary, color.secondary_light]}
        style={styles.container}
        >
          <View>
            <Dialog.Container visible={this.state.showDialog}>
              <Dialog.Title>
                {this.getDialogTitle()}</Dialog.Title>
              <Dialog.Description>Want to play again?
              </Dialog.Description>
              <Dialog.Button label="No"  onPress={() => {this.setState(update(this.state, {showDialog: {$set: false}}))}}/>
              <Dialog.Button label="Yes" onPress={() => {this.props.navigation.goBack()}}/>
            </Dialog.Container>
          </View>
        <Image source={images[this.state.mistakeCount]} style={{
          resizeMode: 'contain',
          maxHeight: 300
          }}/>
        <Text style={[styles.header2, {textAlignVertical: 'top'}]}>{this.state.word}</Text>
        <Keyboard keyboardListener={this.keyboardListener.bind(this)} checkCharPresent={this.checkCharPresent.bind(this)} 
          gameState={this.state.isGameOver}/>
      </LinearGradient>);
  }
}

// // //
// Home screen
// props: {navigation}
// // //
class Home extends React.Component {
  
  #dictionary = Object.keys(dictionary_file)
  constructor(props){
    super(props)
    this.state = {
        showMenu: false,
        wordLength: 5,
        showDialog: false
    }
  }

  randomWordOfLength(length) {
    let arr = this.#dictionary.filter(word => word.length == length)
    if(arr.length !== 0) {
      let ind = Math.floor(Math.random() * arr.length)
      return arr[ind]
    } else {
      return 'X'.repeat(length)
    }
  }


  
  render() {
    return (
    <LinearGradient
      // Button Linear Gradient
      end={[0,0]}
      start={[1,1]}
      colors={[color.secondary, color.secondary_light]}
      style={styles.container}
      >
        
        <Dialog.Container visible={this.state.showDialog}>
              <Dialog.Title>{strings.infoTitle}</Dialog.Title>
              <Dialog.Description>{strings.instructions}
              </Dialog.Description>
              <Dialog.Button label={strings.understood}  onPress={() => {this.setState(update(this.state, {showDialog: {$set: false}}))}}/>
            </Dialog.Container>
        <Text style={styles.title}>{strings.title}</Text>
        <Text style={[styles.header2,  {textAlignVertical: 'bottom'}]}>{strings.sliderLabel + this.state.wordLength}</Text>
        <Slider maximumTrackTintColor={color.primary_light} maximumValue={13} minimumTrackTintColor={color.primary} 
          minimumValue={2} onValueChange={(val)=>{this.setState(update(this.state, {wordLength : {$set: val}}))}} step={1} value={this.state.wordLength} trackStyle={{width: 200, height:3} } 
          thumbStyle={{backgroundColor: color.primary}} />
        <View style={styles.buttonContainer}>
          <Button mode="contained"
          style={styles.navbutton}
          contentStyle={styles.buttonContent}
          icon={"information-outline"}
          onPress={
            () => this.props.navigation.navigate('Game', {word: this.randomWordOfLength(this.state.wordLength)})}>
              {strings.startButton}
          </Button>
          <Button mode="contained" onPress={() => {this.setState(update(this.state, {showDialog: {$set: true}}))}}
          style={[styles.navbutton, {marginLeft:-1}]} icon={"information-outline"} contentStyle={styles.buttonContent}>info</Button>
        </View>
    </LinearGradient>);
  }
}
export default function App() {
  const Stack = createNativeStackNavigator();
  return (
    
    <PaperProvider>
      
      
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Home" screenOptions={{headerShown : false}}>
            <Stack.Screen name="Home" component={Home}/>
            <Stack.Screen name="Game" component={Game}/>
          </Stack.Navigator>
        </NavigationContainer>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: {
    flex:1,
    fontSize: 48,
    color: color.on_secondary,
    marginTop: 48
  },
  header2: {
    flex:1,
    fontSize: 24,
    color: color.on_secondary,
    marginBottom:24
  },
  navbutton: {
    backgroundColor: color.primary,
    color: color.on_primary,
    marginHorizontal:4,
    padding: 0,
    height:48,
    flex:1

  },
  buttonText: {
    backgroundColor: 'black'
  },
  buttonContainer: {
    flexDirection:'row',
    marginBottom: 4,
    marginTop: 38,
  },
  buttonContent: {
    height: '100%', 
    width: '100%', 
    justifyContent: 'center'
  },
  
  keyButton: {
    backgroundColor: color.primary,
    padding:0,
    maxWidth: 30,
    minWidth: 20,
    margin: 2
  },
  keyButtonLabel: {
    color: color.on_primary,
    width: 20
  },
  successButton: {
    backgroundColor: color.primary_light,
    padding:0,
    maxWidth: 30,
    minWidth: 20,
    margin: 2
  },
  successButtonLabel: {
    color: color.on_primary_light, 
    width: 20
  },
  errorButton: {
    backgroundColor: color.error,
    padding: 0,
    maxWidth: 30,
    minWidth: 20,
    margin: 2
  },
  errorButtonLabel: {
    color: color.on_error,
    width: 20
  },
  keyLabel: {
    width: 20
  },
  topAlign: {
    textAlignVertical: 'top'
  }
});
