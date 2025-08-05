// Export the models directly
import HomestaySingle from './HomestaySingle';
import Official from './Official';
import Contact from './Contact';
import Location from './Location';
import User from './User';
import CustomField from './CustomField';
import WebContent from './WebContent';
import Navigation from './Navigation';
 import Chat from './Chat';
import Message from './Message';
import UserStatus from './UserStatus';

export {
  HomestaySingle,
  Official, 
  Contact,
  Location,
  User,
  CustomField,
  WebContent,
  Navigation,
  Chat,
  Message,
  UserStatus
};

// Export types
export type { IWebContent } from './WebContent';
export type { INavigation } from './Navigation';
export type { IChat } from './Chat';
export type { IMessage } from './Message';
export type { IUserStatus } from './UserStatus';