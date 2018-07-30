import { Component, createElement } from "react";
import "../ui/checkBoxReferenceSetSelector.css";

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
    displayAttr: string;
    fieldCaption: string;
    constraint: string;
    showLabel: string;
}

interface ContainerState {
    checkboxItems: {
        caption: string | number | boolean;
        isChecked: boolean;
    }[];
}
export default class CheckBoxReferenceSetSelectorContainer extends Component<ContainerProps, ContainerState> {

    private entity: string;
    private reference: string;

    constructor(props: ContainerProps) {
        super(props);

        // this.handleChange = this.handleChange.bind(this);
        this.entity = this.props.entity.split("/")[1];
        this.reference = this.props.entity.split("/")[0];
        this.getDataFromXPath = this.getDataFromXPath.bind(this);
    }

    render() {
        return createElement("div",
            {
                className: "checkBoxReferenceSetSelector"
            },
            createElement("label", {}),
            this.state.checkboxItems.map((_items) => {
                   createElement("input", { type: "checkbox", className: "checkbox", key: "CheckboxType" });
            })
        );
    }

    componentWillReceiveProps(props: ContainerProps) {
        if (props.mxObject) {
            this.getDataFromXPath(props.mxObject);
        }
    }

    private getDataFromXPath(mxObject: mendix.lib.MxObject) {
        const constraint = this.props.constraint
            ? this.props.constraint.replace(/\[\%CurrentObject\%\]/gi, mxObject.getGuid())
            : "";
        const XPath = "//" + this.entity + constraint;
        mx.data.get({
            xpath: XPath,
            filter: {
                sort: [ [ this.props.displayAttr, "asc" ] ],
                offset: 0,
                amount: 50
            },
            callback: objects => {
                this.processItems(objects);
                // tslint:disable-next-line:no-console
                console.log(objects);
            }
        });
    }

    private processItems = (contextObject: mendix.lib.MxObject[]) => {
        const checkboxItems = contextObject.map(mxObj => {
            let isChecked = false;
            const caption = mxObj.get(this.props.displayAttr);
            const referencedObjects = this.props.mxObject.getReferences(this.reference) as string[];
            if (referencedObjects !== null && referencedObjects.length > 0) {
                referencedObjects.map(value => {
                    if (mxObj.getGuid() === value) {
                        isChecked = true;
                    }
                });
            }

            return {
                caption,
                isChecked
            };
        });
        this.setState({ checkboxItems });
        // tslint:disable-next-line:no-console
        console.log(this.state.checkboxItems);
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

    public static logError(message: string, style?: string, error?: any) {
        // tslint:disable-next-line:no-console
        window.logger ? window.logger.error(message) : console.log(message, style, error);
    }
}
