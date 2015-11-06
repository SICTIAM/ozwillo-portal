/** @jsx React.DOM */

/**
 * User picker. Users are objects with properties: id, fullname
 * Input props:
 *  - source = a function that takes query, callback and finds users
 *  - users  = a function that loads the existing users and takes a callback
 *
 * API:
 *  - selected: list of selected users
 */

var UserPicker = React.createClass({
  getInitialState: function() {
    return {users:[]};
  },
  init: function() {
    var cpt = this;
    this.props.users(function(data) {
      cpt.setState({users: data});
    }, function() {
        cpt.setState({users:[]});
    });
  },
  componentDidMount: function() {
    // initiate typeahead
  },
  removeUser: function(id) {
    this.setState({
      users: this.state.users.filter(function(user) {
        return user.userid != id;
      })
    });
  },
  getSelectedUsers: function() {
    return this.state.users;
  },
  addUser: function(user){
    if (this.state.users.filter(function(u){ return u.userid == user.userid;}).length == 0) {
      var users = this.state.users;
      users.push(user);
      this.setState({users:users});
    }

  },
  render: function() {
    var removeUser = this.removeUser;
    var usersList = this.state.users.map(function(user) {
      return <User key={user.userid} user={user} remove={removeUser} />;
    });

    return (
      <div>
        <table className="table">
          <thead>
            <tr>
              <th>{t('name')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {usersList}
          </tbody>
        </table>
        <div className="row">
            <div className="col-sm-10 col-sm-offset-1">
                <Typeahead onSelect={this.addUser} source={this.props.source} placeholder={t('settings-add-a-user')}/>
            </div>
        </div>
      </div>
    );
  }
});

var User = React.createClass({
  remove: function(event) {
    this.props.remove(this.props.user.userid);
  },
  render: function() {
    return (
      <tr>
        <td>{this.props.user.fullname}</td>
        <td><button className="btn btn-default" onClick={this.remove}><i className="fa fa-minus-circle"></i></button></td>
      </tr>
    );
  }
});
