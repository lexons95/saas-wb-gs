import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema({
    username: String,
    password: String,
    role: {
        type: String,
        default: 'TENANT'
    },
    icNum: String,
    name: String,
    contact: String,
    tokenCount: {
        type: Number,
        default: 0
    } 
},{timestamps: true});

userSchema.static('getUsers', function(obj = {}) {
  let filterResult = {};
  let sorterResult = {};
  let skipResult = 0;
  let limitResult = 0;

  if (!Object.entries(obj).length === 0 || obj.constructor === Object) {
      
      filterResult = obj.filter ? obj.filter : {};
      let sorter = obj.sorter ? obj.sorter : {};
      sorterResult = Object.assign({},sorter);

      skipResult = obj.skip ? obj.skip : 0;
      limitResult = obj.limit ? obj.limit : 0;

      const orderBy = {
          "desc": -1,
          "acs": 1
      }
      let sorterKeys = Object.keys(sorter);
      sorterKeys.map(aKey=>{
          sorterResult[aKey] = orderBy[aKey];
      })
  }
  return this.find(filterResult).sort(sorterResult).skip(skipResult).limit(limitResult);
});

userSchema.static('findOneOrCreate', async function(obj = null) {
  let newUser = obj;
    let response = {
        success: false,
        message: "",
        data: {}
    }

    if (newUser && newUser.username && newUser.password) {
        let findPromise = this.findOne({username: newUser.username});
        await findPromise.then( async (result, error) => {
            if (error) {
                response = {
                    success: false,
                    message: "error in find",
                    data: error
                }
            }
            else {
                if (result) {
                    response = {
                        success: false,
                        message: "duplicate data found, cannot create",
                        data: null
                    }
                }
                else {
                    let createPromise = this.create(newUser);
                    await createPromise.then((result, error) => {
                        if (error) {
                            response = {
                                success: false,
                                message: "error in create",
                                data: error
                            }
                        }
                        else {
                            response = {
                                success: true,
                                message: "data created",
                                data: result
                            }
                        }
                    });
                }
            }
        })     
    }
    else {
        response = {
            success: false,
            message: "data required not complete",
            data: {}
        }
    }
    
    return response;
});

userSchema.statics.updateUser = async function(user) {

    let response = {
        success: false,
        message: "",
        data: {}
    }

    let filter = {
        username: user.username
    }
    let updatePromise = this.findOneAndUpdate(
        filter,
        user, 
        {
            new: true
        }
    )   
    await updatePromise.then((result, error) => {
        if (error) {
            response = {
                success: false,
                message: "error in update",
                data: error
            }
        }
        else {
            response = {
                success: true,
                message: "data updated",
                data: result
            }
        }
    });

    return response;
}

userSchema.statics.findOneUser = async function(obj) {
    let response = {
        success: false,
        message: "",
        data: {}
    }
    let findPromise = this.findOne(obj);
    await findPromise.then( async (result, error) => {
        if (error) {
            response = {
                success: false,
                message: "error in find",
                data: error
            }
        }
        else {
            if (result) {
                response = {
                    success: true,
                    message: "data found",
                    data: result
                }
            }
            else {
                response = {
                    success: false,
                    message: "user not found",
                    data: null
                }
            }
        }
    })

    return response;
}

userSchema.static('authenticate', async function(obj = {}) {
  let response = {
    success: false,
    message: "",
    data: {}
  }
  let user = obj;
  let findPromise = await this.findOne({username: user.username});
  if (findPromise) {
    let matchPassword = await findPromise.validatePassword(user.password)
    // let matchPassword = await bcrypt.compare(user.password, this.password);
    if (matchPassword) {
      response = {
        success: true,
        message: "Success: User found",
        data: findPromise
      }
    }
    else {
      response = {
        success: false,
        message: "Error: password not match",
        data: result
      }
    }
    // matchPassword.then((err, result) => {
    //    if (err) {
    //     response = {
    //       success: false,
    //       message: "Error: password checking error",
    //       data: err
    //     }
    //    }
    //    else {
    //       if (result) {
    //         response = {
    //           success: true,
    //           message: "Success: User found",
    //           data: userFound
    //         }
    //       }
    //       else {
    //         response = {
    //           success: false,
    //           message: "Error: password not match",
    //           data: result
    //         }
    //       }
    //    }
    // });
  }
  else {
    response = {
      success: false,
      message: "Error: user not found",
      data: error
    }
  }


  // findPromise.then(async (userFound, error) => {
  //   if (error) {
  //       response = {
  //           success: false,
  //           message: "Error: user not found",
  //           data: error
  //       }
  //   }
  //   else {
  //     let matchPassword = await bcrypt.compare(password, this.password);
  //     matchPassword.then((err, result2) => {
  //        if (err) {
  //         response = {
  //           success: false,
  //           message: "Error: password checking error",
  //           data: err
  //         }
  //        }
  //        else {
  //           if (result2) {
  //             response = {
  //               success: true,
  //               message: "Success: User found",
  //               data: userFound
  //             }
  //           }
  //           else {
  //             response = {
  //               success: false,
  //               message: "Error: password not match",
  //               data: result2
  //             }
  //           }
  //        }
  //     });
  //   }
  // });

  return response;
});

userSchema.methods.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema); 

export default {
  model: User,
  schema: userSchema,
  User: User
};

/*
email: String,
    name: String,
    address: String,
    ic: String
*/