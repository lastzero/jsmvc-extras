Liquid.Form.extend('Liquid.Form.Test.Form', 
/* @Static */
{
    _definition : {
        'name': {
            'caption': 'Name',
            'type': 'string',
            'min': 3,
            'max': 20,
            'page': 1,
            'default': 'John Anonymous',
            'model': Liquid.Form.Test.Model
        },
        
        'email': {
            'caption': 'E-Mail',
            'type': 'email' ,
            'page': 1           
        },
        
        'email_again': {
            'caption': 'E-Mail (repeated)',
            'type': 'scalar',
            'matches': 'email',
            'page': 1
        },

        'password': {
            'caption': 'Password',
            'type': 'string',
            'regex': /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/,
            'page': 2
        },
        
        'age': {
            'caption': 'Age',
            'type': 'int',
            'min': 0,
            'max': 150,
            'page': 2
        },
        
        'debt': {
            'caption': 'Debt',
            'type': 'numeric',
            'readonly': true,
            'page': 3
        },
        
        'smart': {
            'caption': 'Smart user',
            'type': 'bool',
            'checkbox': true,
            'page': 3
        }
    }
},
/* @Prototype */
{
});
