OpenAI Analyze images

Vision is the ability for a model to "see" and understand images. If there is text in an image, the model can also understand the text. It can understand most visual elements, including objects, shapes, colors, and textures, even if there are some limitations.

Giving a model images as input
You can provide images as input to generation requests in multiple ways:

By providing a fully qualified URL to an image file
By providing an image as a Base64-encoded data URL
By providing a file ID (created with the Files API)
You can provide multiple images as input in a single request by including multiple images in the content array, but keep in mind that images count as tokens and will be billed accordingly.

----
import fs from "fs";
import OpenAI from "openai";

const openai = new OpenAI();

const imagePath = "path_to_your_image.jpg";
const base64Image = fs.readFileSync(imagePath, "base64");

const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [
        {
            role: "user",
            content: [
                { type: "input_text", text: "what's in this image?" },
                {
                    type: "input_image",
                    image_url: `data:image/jpeg;base64,${base64Image}`,
                },
            ],
        },
    ],
});

console.log(response.output_text);
----

Image input requirements
Input images must meet the following requirements to be used in the API.

Supported file types	
PNG (.png) - JPEG (.jpeg and .jpg) - WEBP (.webp) - Non-animated GIF (.gif)
Size limits	
Up to 50 MB total payload size per request - Up to 500 individual image inputs per request
Other requirements	
No watermarks or logos - No NSFW content - Clear enough for a human to understand
Specify image input detail level
The detail parameter tells the model what level of detail to use when processing and understanding the image (low, high, or auto to let the model decide). If you skip the parameter, the model will use auto.

----
{
    "type": "input_image",
    "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg",
    "detail": "high"
}
----

Limitations
While models with vision capabilities are powerful and can be used in many situations, it's important to understand the limitations of these models. Here are some known limitations:

Medical images: The model is not suitable for interpreting specialized medical images like CT scans and shouldn't be used for medical advice.
Non-English: The model may not perform optimally when handling images with text of non-Latin alphabets, such as Japanese or Korean.
Small text: Enlarge text within the image to improve readability, but avoid cropping important details.
Rotation: The model may misinterpret rotated or upside-down text and images.
Visual elements: The model may struggle to understand graphs or text where colors or styles—like solid, dashed, or dotted lines—vary.
Spatial reasoning: The model struggles with tasks requiring precise spatial localization, such as identifying chess positions.
Accuracy: The model may generate incorrect descriptions or captions in certain scenarios.
Image shape: The model struggles with panoramic and fisheye images.
Metadata and resizing: The model doesn't process original file names or metadata, and images are resized before analysis, affecting their original dimensions.
Counting: The model may give approximate counts for objects in images.
CAPTCHAS: For safety reasons, our system blocks the submission of CAPTCHAs.