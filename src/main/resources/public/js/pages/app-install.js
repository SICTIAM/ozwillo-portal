import React from "react";
import Slider from "react-slick";
import customFetch from "../util/custom-fetch";
import ModalImage from "../modal-image";

export default class AppInstall extends React.Component{

    state = {
        app: {},
        appDetails: {
            longdescription: "",
            policy: "",
            rateable: false,
            rating: 0,
            screenshots: [],
            serviceUrl: null,
            tos: ''
        },
        config: {},
    };

    componentDidMount(){
        const {app, config} = this.props.location.state;
        this.setState({app: app, config: config}, () => {
            this.loadApp()
        });


    }

    loadApp = () => {
        const {app} = this.state;
        customFetch(`/api/store/details/${app.type}/${app.id}`)
            .then((data) => this.setState({appDetails: data}));
    };

    _displayScreenShots = (arrayScreenshots) => {
        if(arrayScreenshots) {
            return arrayScreenshots.map((screenshot, index) => {
                return (
                    <div key={index} onClick={() => this._openModal(screenshot)}>
                        <img className={"screenshot"} src={screenshot} alt={"screenshot" + index}/>
                    </div>
                )
            })
        }
    };

    _openModal = (imageSrc) => {
        this.refs.modalImage._openModal(imageSrc);
    };


    render(){
        const {app, appDetails, config} = this.state;
        const settings = {
            dots: true,
            speed: 500,
            slidesToScroll: 1,
            variableWidth: true,
            accessibility: true
        };
        return(
            <div className={"app-install-wrapper"}>
                <div className={"flex-row header-app-install"}>
                    <div className={"information-app flex-row"}>
                        <img alt={"app icon"} src={app.icon}/>
                        <div className={"information-app-details"}>
                            <p><strong>{app.name}</strong></p>
                            <p>{app.provider}</p>
                            <p>{app.description}</p>
                        </div>
                    </div>
                    <div className={"install-app"}>
                        <p>Zone d'install</p>
                    </div>
                </div>

                {appDetails.screenshots.length > 0 &&
                    <div className={"app-install-carousel"}>
                        <div className={"carousel-container"}>
                            <Slider {...settings}>
                                {this._displayScreenShots(appDetails.screenshots)}
                            </Slider>
                        </div>
                    </div>
                }

                <div className={"flex-row app-install-description"}>
                    {app.description}
                </div>
            <ModalImage ref={"modalImage"}/>
            </div>

            // App Install Container
                //First (row)
                    // App information
                    //Install form
                //Second (row)
                    //Carousel
                //Third (row)
                    //Description
        )
    }
}