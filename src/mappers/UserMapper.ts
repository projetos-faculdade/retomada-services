import moment from 'moment';
import UserInput from '../models/UserInput';
import User from './../models/User';
import { Mapper } from './Mapper';

export class UserMapper implements Mapper<User, UserInput> {

    constructor() {}

    toDTO(user: User): any {
        const userModel  = {
            id_user : user.id_user,
            username : user.username,
            email : user.email,
            picture : user.picture,
            password : user.password,
            group_risk : user.group_risk,
            metadata : user.metadata
        };
        return userModel;
    }

    toPersistence(userInput: UserInput): User {
        const user = new User();
        user.username = userInput.username;
        user.email = userInput.email;
        user.picture = userInput.picture;
        user.password = userInput.password;
        user.group_risk = userInput.group_risk;
        user.metadata = userInput.metadata;
        user.organization_id = userInput.organization_id;
        user.creation = moment().format()
        user.last_update = moment().format()
        return user;
    }

}