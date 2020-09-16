const prevModules = require('./prevModules.json');
const currentModules = require('./currentModules.json');
const _ = require('lodash');

let oldModulesArray = prevModules.data.modules;
let newModulesArray = currentModules.data.modules;

let defaultOld = oldModulesArray;
let defaultNew = newModulesArray;

const compareModules = (oldModules=defaultOld, newModules=defaultNew) => {

  let addedModules = []; // equal to new table
  let removedModules = [];
  let editedModules = [];
  let notEditedModules = [];

  oldModules.forEach((anOldModule)=>{
    let foundModule = newModules.find((aNewModule)=>aNewModule.id==anOldModule.id);
    if (!foundModule) {
      removedModules.push(anOldModule)
    }
    else {
      if (!(_.isEqual(anOldModule,foundModule))) {
        let addedProperties = [];
        let removedProperties = [];
        let editedProperties = [];
        let notEditedProperties = [];
  
        anOldModule.properties.forEach((anOldProperty)=>{
          let foundProperty = foundModule.properties.find((aNewProperty)=>aNewProperty.id==anOldProperty.id);
          if (!foundProperty) {
            removedProperties.push(anOldProperty)
          }
          else {
            if (!(_.isEqual(anOldProperty,foundProperty))) {
              editedProperties.push(foundProperty)
            }
            else {
              // notEditedProperties.push(anOldProperty)
            }
          }
        })
  
        foundModule.properties.forEach((aNewProperty)=>{
          let foundProperty = anOldModule.properties.find((anOldProperty)=>anOldProperty.id==aNewProperty.id);
          if (!foundProperty) {
            addedProperties.push(foundProperty)
          }
        })
  
        let newObj = {
          oldModule: anOldModule,
          newModule: foundModule,
          add: addedProperties,
          remove: removedProperties,
          edit: editedProperties,
          // notEditedProperties
        }
        editedModules.push(newObj)
      }
      else {
        // notEditedModules.push(anOldModule)
      }
    }
  })

  newModules.forEach((aNewModules)=>{
    let foundModule = oldModules.find((anOldModule)=>anOldModule.id==aNewModules.id);
    if (!foundModule) {
      addedModules.push(aNewModules)
    }
  })

  // let logg = {
  //   addedModules,
  //   removedModules,
  //   editedModules,
  //   notEditedModules,
  //   length: {
  //     addedModules: addedModules.length,
  //     removedModules: removedModules.length,
  //     editedModules: editedModules.length,
  //     notEditedModules: notEditedModules.length,
  //     oldModules: oldModulesArray.length,
  //     newModules: newModulesArray.length
  //   },
  //   allOld: oldModulesArray,
  //   allNew: newModulesArray
  // }


  return {
    addedModules,
    removedModules,
    editedModules,
    // notEditedModules
  };
}

export const generateMigration = (config=compareModules()) => {

  const getPromises = (queryInterface, Sequelize, t) => {
    const _getSchemaAttributeType = (type = '') => {
      switch (type) {
        case 'string':
        case 'listgroup':
          return Sequelize.STRING;
  
        case 'json':
        case 'jsonlist':
        case 'text':
          return Sequelize.TEXT;
  
        case 'integer':
          return Sequelize.INTEGER;
  
        case 'float':
          return Sequelize.DECIMAL(19, 5);
  
        case 'boolean':
          return Sequelize.BOOLEAN;
  
        case 'date':
          return Sequelize.DATEONLY;
  
        case 'datetime':
          return Sequelize.DATE;
  
        case 'uuid':
          return Sequelize.UUID;
  
        case 'seqnum':
          return Sequelize.INTEGER;
      }
      return Sequelize.STRING;
    }

    let {
      addedModules,
      removedModules,
      editedModules
    } = config;

    let upPromises = [];
    let downPromises = [];

    editedModules.forEach((anEditedModule)=>{
      const {
        add: addedProperties,
        remove: removedProperties,
        edit: editedProperties,
        newModule
      } = anEditedModule;
  
      let tableName = newModule.code;

      addedProperties.forEach((aProperty)=>{
        let propertyName = aProperty.code;
        let attribute = {
          type: _getSchemaAttributeType(aProperty.type)
        }
        upPromises.push(
          queryInterface.addColumn(tableName, propertyName, attribute, { transaction: t })
        )
        downPromises.push(
          queryInterface.removeColumn(tableName, propertyName, { transaction: t })
        )
      })

      removedProperties.forEach((aProperty)=>{
        let propertyName = aProperty.code;
        let attribute = {
          type: Sequelize.DataTypes.STRING
        }
        upPromises.push(
          queryInterface.removeColumn(tableName, propertyName, { transaction: t })
        )
        downPromises.push(
          queryInterface.addColumn(tableName, propertyName, attribute, { transaction: t })
        )
      })

    })

    return {
      up: Promise.all(upPromises),
      down: Promise.all(downPromises)
    }
  }

  let result = {
    up: (queryInterface, Sequelize) => {
      return queryInterface.sequelize.transaction(t => {
        return getPromises(queryInterface, Sequelize, t).up;
      });
    },
    down: (queryInterface, Sequelize) => {
      return queryInterface.sequelize.transaction(t => {
        return getPromises(queryInterface, Sequelize, t).down;
      });
    }
  }

  console.log('%c compareModules','background: black; color: lightgreen',config)
  console.log('%c compareModules migration','background: black; color: lightgreen',result)
  return result;
}

generateMigration()


// const MIGRATION_METHOD = (queryInterface, Sequelize, tableName, propertyName, attribute, options={ transaction: t }) => {
//   return {
//     addColumn: queryInterface.addColumn(tableName, propertyName, attribute, options),
//     removeColumn: queryInterface.removeColumn(tableName, propertyName, options),
//   }
// };

// const isEqual = (obj1, obj2) => {
//   let obj1Keys = Object.keys(obj1);
//   let obj2Keys = Object.keys(obj2);

//   for (let obj1Key of obj1Keys) {
//     let obj1KeyValue = obj1[obj1Key];
//     let obj1KeyValueType = typeof(obj1KeyValue);
//     let obj2KeyValue = obj2[obj1Key];
//     let obj2KeyValueType = typeof(obj2KeyValue);
    
//     // diff data type
//     if (obj1KeyValueType != obj2KeyValueType) {return false}

//     // not object/array
//     if (obj1KeyValueType != 'object' && obj2KeyValueType != 'object') {
//       if (obj1KeyValue != obj2KeyValue) {return false};
//     }

//     // both object/array
//     else {
//       let isObj1Array = Array.isArray(obj1KeyValue);
//       let isObj2Array = Array.isArray(obj2KeyValue);

//       // diff data type
//       if (isObj1Array != isObj2Array) {return false}
//       // both object
//       if (!isObj1Array && !isObj2Array) {
//         return isEqual(obj1KeyValue,obj2KeyValue);
//       }
//       // both array
//       else {

//       }
//     }

//   }

//   return true;
// }