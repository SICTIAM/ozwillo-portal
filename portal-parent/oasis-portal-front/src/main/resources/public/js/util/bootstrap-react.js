/** @jsx React.DOM */

/**
 * Bootstrap Modal encapsulation.
 * Expected props:
 *  - title - String (will be shown as title)
 *  - successHandler - callback that is called on validation
 * Children as content.
 * Open explicitly by calling the open() method. The close() method is also
 * available.
 */
var Modal = React.createClass({displayName: 'Modal',
    componentDidMount: function () {
        $(this.getDOMNode()).modal({show: false});
    },
    componentWillUnmount: function () {
        $(this.getDOMNode()).off('hidden');
    },
    close: function () {
        $(this.getDOMNode()).modal('hide');

    },
    open: function () {
        $(this.getDOMNode()).modal('show');
        // if (this.props.onOpen != undefined) {
        //   this.props.onOpen();
        // }
    },
    render: function () {
        return (
            React.DOM.div({className: "modal fade"}, 
                React.DOM.div({className: 'modal-dialog' + (this.props.large ? ' modal-lg' : '')}, 
                    React.DOM.div({className: "modal-content"}, 
                        React.DOM.div({className: "modal-header"}, 
                            React.DOM.button({
                            type: "button", 
                            className: "close", 
                            onClick: this.close}, "×"), 
                            React.DOM.h3(null, this.props.title)
                        ), 
                        React.DOM.div({className: "modal-body"}, 
          this.props.children
                        ), 
                        React.DOM.div({className: "modal-footer"}, 
                            React.DOM.button({className: "btn btn-default", onClick: this.close}, "Dismiss"), 
                            React.DOM.button({className: "btn btn-primary", onClick: this.props.successHandler}, "Save")
                        )
                    )
                )
            )
            );
    }
});

/**
 * Not really Bootstrap, but it's Twitter anyway...
 * Creates a simple typeahead
 * input props:
 *  - source: a function(query, cb)
 *  - onSelect: a callback that is called when an item is selected
 */
var Typeahead = React.createClass({displayName: 'Typeahead',
    componentDidMount: function () {

        $(this.getDOMNode()).typeahead({
            minLength: 3,
            highlight: true
        }, {
            source: this.props.source,
            displayKey: 'fullname'
        }).on("typeahead:selected", function (event, selected) {
            if (this.props.onSelect != undefined) {
                this.props.onSelect(selected);
            }
            $(this.getDOMNode()).typeahead('val', '');
        }.bind(this));
    },
    render: function () {
        return (
            React.DOM.input({className: "form-control", type: "text", placeholder: this.props.placeholder})
            );
    }
});