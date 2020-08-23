import bcrypt from 'bcryptjs';

export const createPassword = (input, saltValue=10) => {
    let result = "";
    const salt = bcrypt.genSaltSync(saltValue);
    let hash = bcrypt.hashSync(input, salt);
    result = hash;
    return result;
}