import { Component, createElement } from "react";
import "../ui/checkBoxReferenceSetSelector.css";
import CheckBoxReferenceSetSelector from "./checkBoxReferenceSetSelector";

interface WrapperProps {
    class: string;
    mxObject: mendix.lib.MxObject;
    mxform: mxui.lib.form._FormBase;
    style: string;
    readOnly: boolean;

}

export interface ContainerProps extends WrapperProps {
    checkBoxType: string;
    dataSource: "xpath" | "microflow";
    entity: string;
    displayAttribute: string;
    fieldCaption: string;
    constraint: string;
    showLabel: string;
    caption: string;
    attr: string;
    microflow: string;
    callMicroflow: string;
    formOrientation: "Horizontal" | "Vertical";
    labelWidth: string;
    readonly: "True" | "False";
}

// tslint:disable-next-line:interface-over-type-literal
export type CheckboxItems = {
    caption?: string | number | boolean,
    guid: string;
    isChecked: boolean;
};

interface ContainerState {
    checkboxItems: CheckboxItems[];
}

export default class CheckBoxReferenceSetSelectorContainer extends Component<ContainerProps, ContainerState> {
    private subscriptionHandles: number[] = [];
    readonly state: ContainerState = {
        checkboxItems: []
    };
    private entity: string;
    private reference: string;
    constructor(props: ContainerProps) {
        super(props);

        this.entity = this.props.entity.split("/")[1];
        this.reference = this.props.entity.split("/")[0];
        this.getDataFromXPath = this.getDataFromXPath.bind(this);
        this.getDataFromMicroflow = this.getDataFromMicroflow.bind(this);
        this.executeMicroflow = this.executeMicroflow.bind(this);

    }

    render() {
        return createElement(CheckBoxReferenceSetSelector, {
            checkboxItems: this.state.checkboxItems,
            handleChange: this.handleChange,
            fieldCaption: this.props.fieldCaption
        });
    }

    componentWillReceiveProps(newProps: ContainerProps) {
        if (newProps.mxObject) {
            this.resetSubscriptions(newProps.mxObject);
            this.fetchData();
        } else {
            this.setState({ checkboxItems: [] });
        }
    }

    private getDataFromXPath(mxObject: mendix.lib.MxObject) {
        const constraint = this.props.constraint
            ? this.props.constraint.replace(/\[\%CurrentObject\%\]/gi, mxObject.getGuid())
            : "";
        const xpath = "//" + this.entity + constraint;
        mx.data.get({
            xpath,
            filter: {
                sort: [ [ this.props.displayAttribute, "asc" ] ],
                offset: 0,
                amount: 50
            },
            callback: objects => {
                this.processItems(objects);
            }
        });
    }

    // TODO: Fix subscriptions per attribute, entity

    private resetSubscriptions(mxObject: mendix.lib.MxObject) {
        this.subscriptionHandles.forEach(window.mx.data.unsubscribe);
        this.subscriptionHandles = [];
        if (mxObject) {
            this.subscriptionHandles.push(window.mx.data.subscribe({
                guid: mxObject.getGuid(),
                callback: () => this.fetchData()
            }));

            this.subscriptionHandles.push(window.mx.data.subscribe({
                guid: mxObject.getGuid(),
                attr: this.reference,
                callback: () => this.fetchData()
            }));

            this.subscriptionHandles.push(window.mx.data.subscribe({
                guid: mxObject.getGuid(),
                val: true,
                callback: () => this.fetchData()
            }));
        }
    }

    private fetchData() {
        if (this.props.dataSource === "xpath") {
            this.getDataFromXPath(this.props.mxObject);
        } else {
            this.getDataFromMicroflow();
        }
    }

    private getDataFromMicroflow() {
        mx.data.action({
            params: {
                applyto: "selection",
                actionname: this.props.callMicroflow
            },
            origin: this.props.mxform,
            callback: (mxObject: mendix.lib.MxObject[]) => this.processItems(mxObject),
            error: (error) => {
                mx.ui.error(error.message);
            }
        });

}
    private handleChange = (checked: boolean, guid: string) => {
        const { microflow } = this.props;
        if (this.props.mxObject && checked) {
            this.props.mxObject.addReferences(this.reference, [ guid ]);
        } else {
            this.props.mxObject.removeReferences(this.reference, [ guid ]);
        }
        this.executeMicroflow(microflow);
    }

    private executeMicroflow(microflow: string) {
        if (this.props.mxObject && microflow) {
            mx.data.action({
                params: {
                    applyto: "selection",
                    actionname: microflow,
                    guids: [ this.props.mxObject.getGuid() ]
                },
                origin: this.props.mxform,
                // tslint:disable-next-line:only-arrow-functions
                callback: () => undefined,
                error: (error) => {
                    mx.ui.error(error.message);
                }
            });
        }
    }

    private processItems = (itemObjects: mendix.lib.MxObject[]) => {
        if (itemObjects.length > 0) {
            const checkboxItems = itemObjects.map(mxObj => {
                let isChecked = false;
                const caption = mxObj.get(this.props.displayAttribute);
                const referencedObjects = this.props.mxObject.getReferences(this.reference) as string[];
                if (referencedObjects !== null && referencedObjects.length > 0) {
                    referencedObjects.map(value => {
                        if (mxObj.getGuid() === value) {
                            isChecked = true;
                        }
                    });
                }
                return {
                    guid: mxObj.getGuid(),
                    caption,
                    isChecked
                };
            });
            this.setState({ checkboxItems });
        }
    }
    public static parseStyle(style = ""): { [key: string]: string } {
        try {
            return style.split(";").reduce<{ [key: string]: string }>((styleObject, line) => {
                const pair = line.split(":");
                if (pair.length === 2) {
                    const name = pair[0].trim().replace(/(-.)/g, match => match[1].toUpperCase());
                    styleObject[name] = pair[1].trim();
                }
                return styleObject;
            }, {});
        } catch (error) {
            CheckBoxReferenceSetSelectorContainer.logError("Failed to parse style", style, error);
        }

        return {};
    }

    // tslint:disable-next-line:align
    public static logError(message: string, style?: string, error?: any) {
        // tslint:disable-next-line:no-console
        window.logger ? window.logger.error(message) : console.log(message, style, error);
    }
}
